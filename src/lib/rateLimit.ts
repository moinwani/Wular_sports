import type { NextApiRequest } from 'next';

const store = new Map<string, { count: number; windowStart: number }>();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_MAX = 20;

export function getClientIp(req: NextApiRequest): string {
    // Prefer the platform-set x-real-ip. Fall back to the LAST x-forwarded-for
    // hop (appended by our proxy) — the first entries are client-controlled
    // and trivially spoofable to reset the rate limit.
    const realIp = req.headers['x-real-ip'];
    if (realIp && typeof realIp === 'string') return realIp.trim();

    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const parts = (Array.isArray(forwarded) ? forwarded.join(',') : forwarded).split(',');
        return parts[parts.length - 1].trim();
    }
    return req.socket?.remoteAddress || 'unknown';
}

export function checkRateLimit(ip: string, max = DEFAULT_MAX): { allowed: boolean; retryAfterMs?: number } {
    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || now - entry.windowStart > WINDOW_MS) {
        store.set(ip, { count: 1, windowStart: now });
        return { allowed: true };
    }

    if (entry.count >= max) {
        return { allowed: false, retryAfterMs: WINDOW_MS - (now - entry.windowStart) };
    }

    entry.count++;
    return { allowed: true };
}
