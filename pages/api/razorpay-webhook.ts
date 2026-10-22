import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { confirmPaidOrder, findOrderByRazorpayOrderId } from '../../src/lib/orderNotifications';

/**
 * Razorpay webhook — Razorpay calls this directly when a payment succeeds,
 * independent of the customer's browser. Confirms the order and sends the
 * order emails if the browser-side verify call never made it.
 *
 * Setup (Razorpay Dashboard → Settings → Webhooks):
 *   URL:    https://wularsports.com/api/razorpay-webhook
 *   Events: payment.captured, order.paid
 *   Secret: same value as the RAZORPAY_WEBHOOK_SECRET env var on Vercel
 */

// Signature is computed over the exact raw bytes Razorpay sent
export const config = { api: { bodyParser: false } };

const readRawBody = async (req: NextApiRequest): Promise<Buffer> => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    return Buffer.concat(chunks);
};

const signatureMatches = (raw: Buffer, signature: string, secret: string): boolean => {
    const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature || '');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
        console.error('RAZORPAY_WEBHOOK_SECRET is not set — webhook cannot be verified');
        return res.status(500).json({ error: 'Webhook not configured' });
    }

    const raw = await readRawBody(req);
    if (!signatureMatches(raw, req.headers['x-razorpay-signature'] as string, secret)) {
        return res.status(400).json({ error: 'Invalid signature' });
    }

    let body: any;
    try {
        body = JSON.parse(raw.toString('utf-8'));
    } catch {
        return res.status(400).json({ error: 'Invalid JSON' });
    }

    if (body.event !== 'payment.captured' && body.event !== 'order.paid') {
        return res.status(200).json({ status: 'ignored', event: body.event });
    }

    const payment = body.payload?.payment?.entity;
    const rzpOrderId: string | undefined = payment?.order_id || body.payload?.order?.entity?.id;
    if (!rzpOrderId) {
        return res.status(200).json({ status: 'ignored', reason: 'no order id' });
    }

    try {
        const ref = await findOrderByRazorpayOrderId(rzpOrderId);
        if (!ref) {
            // A payment not created by our checkout (e.g. a manual payment link)
            return res.status(200).json({ status: 'ignored', reason: 'order not found' });
        }
        const result = await confirmPaidOrder(ref, payment?.id);
        if (result.emailFailed) {
            // Non-2xx makes Razorpay retry later; already-sent emails won't repeat
            return res.status(502).json({ status: 'email_failed', emails: result.emails });
        }
        return res.status(200).json({ status: 'ok' });
    } catch (err: any) {
        console.error('Webhook processing failed:', err?.message || err);
        return res.status(500).json({ error: 'Processing failed' });
    }
}
