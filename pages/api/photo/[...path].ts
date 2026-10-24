import type { NextApiRequest, NextApiResponse } from 'next';
import { Readable } from 'stream';
import { get } from '@vercel/blob';

/**
 * Serves product photos from a private Vercel Blob store
 * (/api/photo/products/<id>/<file>). Photo names carry a random suffix and
 * never change, so they're cached for a year by browsers and Vercel's CDN.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const parts = Array.isArray(req.query.path) ? req.query.path : [];
    const pathname = parts.join('/');
    if (req.method !== 'GET' || !pathname.startsWith('products/') || pathname.includes('..')) {
        return res.status(404).end();
    }
    try {
        const r = await get(pathname, { access: 'private' });
        if (!r || r.statusCode !== 200) return res.status(404).end();
        res.setHeader('Content-Type', r.blob.contentType || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        Readable.fromWeb(r.stream as any).pipe(res);
    } catch (err: any) {
        console.error('photo fetch failed:', pathname, err?.message);
        return res.status(404).end();
    }
}
