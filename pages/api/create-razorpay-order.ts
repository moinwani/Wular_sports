import type { NextApiRequest, NextApiResponse } from 'next';
import Razorpay from 'razorpay';
import { products } from '../../src/data/products';
import { getClientIp, checkRateLimit } from '../../src/lib/rateLimit';
import { auth } from '../../src/lib/firebaseAdmin';

const COD_BOOKING_PER_BAT = 500;

function getRazorpay(): Razorpay {
    const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
        throw new Error('Razorpay credentials not configured');
    }
    return new Razorpay({ key_id, key_secret });
}

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
    const { allowed, retryAfterMs } = checkRateLimit(ip, 10);
    if (!allowed) {
        res.setHeader('Retry-After', Math.ceil((retryAfterMs || 0) / 1000).toString());
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    try {
        await verifyAuth(req);
    } catch {
        return res.status(401).json({ error: 'Authentication required. Please sign in to continue.' });
    }

    const { items, paymentMethod, receipt, notes } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Invalid items' });
    }

    if (paymentMethod !== 'full' && paymentMethod !== 'cod') {
        return res.status(400).json({ error: 'Invalid payment method' });
    }

    // Compute amount server-side from authoritative product catalog
    let orderTotal = 0;
    let totalBats = 0;

    for (const item of items) {
        const product = products.find(p => p.id === item.id);
        if (!product) {
            return res.status(400).json({ error: `Unknown product: ${item.id}` });
        }
        const qty = Number(item.quantity);
        if (!Number.isInteger(qty) || qty < 1 || qty > 100) {
            return res.status(400).json({ error: 'Invalid quantity' });
        }
        orderTotal += product.price * qty;
        totalBats += qty;
    }

    const chargeAmount = paymentMethod === 'cod'
        ? totalBats * COD_BOOKING_PER_BAT
        : orderTotal;

    try {
        const order = await getRazorpay().orders.create({
            amount: chargeAmount * 100, // paise
            currency: 'INR',
            receipt: (receipt || `rcpt_${Date.now()}`).toString().substring(0, 40),
            notes: notes || {},
        });

        return res.status(200).json({
            orderId: order.id,
            amount: order.amount,
            orderTotal,
            chargeAmount,
        });
    } catch (err: any) {
        console.error('Razorpay order creation failed:', err);
        return res.status(500).json({ error: 'Failed to create payment order' });
    }
}
