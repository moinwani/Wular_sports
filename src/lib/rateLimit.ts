import type { NextApiRequest } from 'next';

const store = new Map<string, { count: number; windowStart: number }>();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_MAX = 20;

export function getClientIp(req: NextApiRequest): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(',')[0].trim();
    }
    return (req.headers['x-real-ip'] as string) || req.socket?.remoteAddress || 'unknown';
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
