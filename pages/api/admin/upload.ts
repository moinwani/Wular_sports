import type { NextApiRequest, NextApiResponse } from 'next';
import { isAdminRequest } from '../../../src/lib/adminAuth';
import { deleteUnusedPhotos, photosReady, savePhoto } from '../../../src/lib/productPhotos';

/**
 * Admin photo upload. The browser shrinks each photo first, then sends the
 * raw image bytes here (Content-Type image/jpeg|png|webp).
 *
 *  POST   ?product=<id>&name=<file name>  body: image bytes → { url }
 *  DELETE { url }  removes a photo that no product uses (e.g. uploaded then removed before saving)
 */

export const config = { api: { bodyParser: false } };

const MAX_BYTES = 4 * 1024 * 1024; // Vercel's request limit is 4.5 MB
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const readBody = (req: NextApiRequest): Promise<Buffer> =>
    new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        let size = 0;
        req.on('data', (c: Buffer) => {
            size += c.length;
            if (size > MAX_BYTES) {
                reject(new Error('too large'));
                req.destroy();
            } else chunks.push(c);
        });
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!(await isAdminRequest(req))) return res.status(403).json({ error: 'Admin access required' });
    if (!photosReady()) {
        return res.status(503).json({ error: 'Photo storage isn’t switched on yet (Vercel Blob storage needs to be connected to the project).' });
    }

    try {
        if (req.method === 'POST') {
            const type = String(req.headers['content-type'] || '').split(';')[0].trim();
            if (!TYPES.includes(type)) return res.status(400).json({ error: 'Only JPG, PNG or WebP photos' });
            let body: Buffer;
            try {
                body = await readBody(req);
            } catch {
                return res.status(413).json({ error: 'Photo is too big (max 4 MB after shrinking)' });
            }
            if (body.length < 100) return res.status(400).json({ error: 'Empty file' });
            const url = await savePhoto(String(req.query.product || 'new'), String(req.query.name || 'photo'), body, type);
            return res.status(200).json({ url });
        }

        if (req.method === 'DELETE') {
            const raw = (await readBody(req)).toString('utf8');
            let url = '';
            try { url = JSON.parse(raw).url; } catch { /* bad body */ }
            if (typeof url !== 'string' || !url) return res.status(400).json({ error: 'Missing url' });
            await deleteUnusedPhotos([url]);
            return res.status(200).json({ ok: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err: any) {
        console.error('admin/upload failed:', err?.message);
        // Show the storage service's own reason so problems can be fixed quickly
        return res.status(500).json({ error: `Upload failed: ${String(err?.message || 'unknown error').slice(0, 200)}` });
    }
}
