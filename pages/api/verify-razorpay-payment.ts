import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
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
