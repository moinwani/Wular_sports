import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { getClientIp, checkRateLimit } from '../../src/lib/rateLimit';
import { auth, db, FieldValue } from '../../src/lib/firebaseAdmin';

async function verifyAuth(req: NextApiRequest): Promise<{ uid: string }> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Missing authorization header');
    }
    const token = authHeader.split('Bearer ')[1];
    const decoded = await auth.verifyIdToken(token);
    return { uid: decoded.uid };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const ip = getClientIp(req);
    const { allowed, retryAfterMs } = checkRateLimit(ip, 20);
    if (!allowed) {
        res.setHeader('Retry-After', Math.ceil((retryAfterMs || 0) / 1000).toString());
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    let uid: string;
    try {
        ({ uid } = await verifyAuth(req));
    } catch {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, firestoreOrderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
        return res.status(500).json({ error: 'Payment verification not configured' });
    }

    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    if (expectedSignature !== razorpay_signature) {
        console.error('Razorpay signature mismatch — possible tampered payment');
        return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Payment is genuine — confirm the pending order server-side so the
    // record is correct even if the customer's browser dies right after this.
    if (firestoreOrderId && typeof firestoreOrderId === 'string') {
        try {
            const orderRef = db.collection('orders').doc(firestoreOrderId);
            const snap = await orderRef.get();
            if (snap.exists) {
                const order = snap.data()!;
                // Only the owner of the order may confirm it, and the payment
                // must belong to this order's Razorpay order id.
                if (order.userId === uid && order.razorpayOrderId === razorpay_order_id) {
                    await orderRef.update({
                        status: 'confirmed',
                        // COD keeps paymentStatus 'pending' (balance due at door);
                        // full payments are complete.
                        paymentStatus: order.paymentMethod === 'full' ? 'completed' : 'pending',
                        paymentId: razorpay_payment_id,
                        razorpayPaymentId: razorpay_payment_id,
                        updatedAt: FieldValue.serverTimestamp(),
                    });
                } else {
                    console.error('Order/payment mismatch on verify:', firestoreOrderId);
                }
            }
        } catch (err) {
            // The payment itself is verified — never fail the customer flow
            // over a status update; the admin can reconcile via Razorpay.
            console.error('Failed to mark order confirmed:', err);
        }
    }

    return res.status(200).json({ verified: true });
}
