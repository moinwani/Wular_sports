import type { NextApiRequest, NextApiResponse } from 'next';
import { getClientIp, checkRateLimit } from '../../src/lib/rateLimit';
import { resolveCoupon } from '../../src/lib/coupons';
import { couponLabel } from '../../src/lib/marketing';

/** Checkout coupon check. Returns only what the checkout needs to show the discount. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    // Slow down code guessing
    const { allowed } = checkRateLimit(`coupon:${getClientIp(req)}`, 20);
    if (!allowed) return res.status(429).json({ error: 'Too many attempts. Please wait a minute.' });

    try {
        const c = await resolveCoupon(req.query.code);
        if (!c) return res.status(404).json({ error: 'Invalid or expired coupon code' });
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).json({ code: c.code, type: c.type, value: c.value, label: couponLabel(c) });
    } catch (err: any) {
        console.error('coupon lookup failed:', err?.message);
        return res.status(500).json({ error: 'Could not check the coupon. Please try again.' });
    }
}
