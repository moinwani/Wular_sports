import type { NextApiRequest, NextApiResponse } from 'next';
import Razorpay from 'razorpay';
import { getClientIp, checkRateLimit } from '../../src/lib/rateLimit';
import { auth, db } from '../../src/lib/firebaseAdmin';
import { confirmPaidOrder } from '../../src/lib/orderNotifications';
import { orderProblem } from '../../src/lib/orderIntegrity';

/**
 * "Has my order been paid?" — asked by the checkout when the Razorpay window
 * is closed, when the payment check didn't get through, or when the page is
 * opened again with an unfinished payment. Answers only for the buyer's own
 * order.
 *
 * If our order is still pending but Razorpay already has a captured payment
 * for it (the buyer paid in their UPI app and the webhook hasn't arrived yet),
 * the order is confirmed here — with the same integrity check as the webhook.
 * The checkout then shows "order placed" instead of letting the buyer pay twice.
 */

const PAID_STATUSES = new Set(['confirmed', 'processing', 'shipped', 'delivered']);

const razorpay = () => new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

async function verifyAuth(req: NextApiRequest): Promise<string> {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) throw new Error('Missing authorization header');
    const decoded = await auth.verifyIdToken(header.split('Bearer ')[1]);
    return decoded.uid;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    res.setHeader('Cache-Control', 'no-store');

    const { allowed } = checkRateLimit(`order-status:${getClientIp(req)}`, 60);
    if (!allowed) return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });

    let uid: string;
    try {
        uid = await verifyAuth(req);
    } catch {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const id = typeof req.body?.firestoreOrderId === 'string' ? req.body.firestoreOrderId : '';
    if (!id || id.length > 100 || id.includes('/')) return res.status(400).json({ error: 'Missing order' });

    try {
        const ref = db.collection('orders').doc(id);
        const snap = await ref.get();
        const o = snap.exists ? snap.data()! : null;
        // Someone else's order looks the same as a missing one
        if (!o || o.userId !== uid) return res.status(404).json({ error: 'Order not found' });

        if (PAID_STATUSES.has(o.status)) return res.status(200).json({ paid: true, status: o.status, method: o.paymentMethod });
        if (o.status !== 'pending' || !o.razorpayOrderId) return res.status(200).json({ paid: false, status: o.status });

        // Still pending on our side — ask Razorpay whether a payment came through
        const { items = [] } = (await razorpay().orders.fetchPayments(o.razorpayOrderId)) as any;
        const captured = items.find((p: any) => p.status === 'captured');
        if (!captured) {
            // "authorized" = the bank approved it and capture is moments away
            const authorised = items.some((p: any) => p.status === 'authorized');
            return res.status(200).json({ paid: false, processing: authorised, status: 'pending' });
        }

        const rzpOrder: any = await razorpay().orders.fetch(o.razorpayOrderId);
        const problem = orderProblem(o, Number(rzpOrder?.amount));
        if (problem) {
            // The buyer did pay; don't auto-confirm a tampered order — flag it for the owner
            console.error('order-status: order failed integrity check', id, problem);
            await ref.update({ needsReview: problem });
            return res.status(200).json({ paid: true, status: 'pending', review: true, method: o.paymentMethod });
        }
        await confirmPaidOrder(ref, captured.id);
        return res.status(200).json({ paid: true, status: 'confirmed', method: o.paymentMethod });
    } catch (err: any) {
        console.error('order-status failed:', err?.message || err);
        return res.status(500).json({ error: 'Could not check the order right now' });
    }
}
