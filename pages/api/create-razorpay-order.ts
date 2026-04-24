import type { NextApiRequest, NextApiResponse } from 'next';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { amount, receipt, notes } = req.body;

    if (!amount || amount < 100) {
        return res.status(400).json({ error: 'Invalid amount' });
    }

    try {
        const order = await razorpay.orders.create({
            amount: Math.round(amount), // already in paise from frontend
            currency: 'INR',
            receipt: receipt || `rcpt_${Date.now()}`,
            notes: notes || {},
        });

        return res.status(200).json({ orderId: order.id, amount: order.amount });
    } catch (err: any) {
        console.error('Razorpay order creation failed:', err);
        return res.status(500).json({ error: 'Failed to create payment order' });
    }
}
