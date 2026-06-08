import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { getClientIp, checkRateLimit } from '../../src/lib/rateLimit';
import { auth } from '../../src/lib/firebaseAdmin';

async function verifyAuth(req: NextApiRequest): Promise<void> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Missing authorization header');
    }
    const token = authHeader.split('Bearer ')[1];
    await auth.verifyIdToken(token);
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

    try {
        await verifyAuth(req);
    } catch {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

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

    return res.status(200).json({ verified: true });
}
