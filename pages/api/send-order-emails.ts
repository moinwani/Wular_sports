import type { NextApiRequest, NextApiResponse } from 'next';
import { getClientIp, checkRateLimit } from '../../src/lib/rateLimit';

/**
 * Server-side relay to the Apps Script email bridge.
 *
 * Keeps the bridge URL (and optional shared secret) out of the public JS
 * bundle so strangers can't send "Wular Sports" emails. Requires a Firebase
 * session (guests are anonymous-authed at checkout) and is rate-limited.
 *
 * Env:
 *  - EMAIL_BRIDGE_URL     (server-only; falls back to NEXT_PUBLIC_EMAIL_BRIDGE_URL)
 *  - EMAIL_BRIDGE_SECRET  (optional; forwarded as payload.secret for the
 *                          Apps Script to verify)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { allowed } = checkRateLimit(getClientIp(req), 10);
    if (!allowed) {
        return res.status(429).json({ error: 'Too many requests' });
    }

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Error('missing token');
        }
        const { auth } = await import('../../src/lib/firebaseAdmin');
        await auth.verifyIdToken(authHeader.split('Bearer ')[1]);
    } catch {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const bridgeUrl = process.env.EMAIL_BRIDGE_URL || process.env.NEXT_PUBLIC_EMAIL_BRIDGE_URL;
    if (!bridgeUrl) {
        return res.status(200).json({ status: 'skipped', reason: 'no_bridge' });
    }

    const payload = req.body?.payload;
    if (
        !payload ||
        typeof payload !== 'object' ||
        !['customer_confirmation', 'admin_notification'].includes(payload.type)
    ) {
        return res.status(400).json({ error: 'Invalid payload' });
    }

    try {
        await fetch(bridgeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...payload,
                secret: process.env.EMAIL_BRIDGE_SECRET || '',
            }),
        });
        return res.status(200).json({ status: 'success' });
    } catch (err) {
        console.error('Email bridge relay failed:', err);
        return res.status(200).json({ status: 'error' });
    }
}
