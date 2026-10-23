import type { NextApiRequest, NextApiResponse } from 'next';
import { getClientIp, checkRateLimit } from '../../src/lib/rateLimit';
import { auth, db, FieldValue } from '../../src/lib/firebaseAdmin';
import { sanitizeAttribution } from '../../src/lib/marketing';

/**
 * Stores where a visitor came from, keyed by their Ref code (visitors/{ref}).
 * The Ref code is in every WhatsApp message the site pre-fills, so when that
 * chat becomes a sale, the admin panel can credit it to the right ad.
 *
 * Written only through this route (Admin SDK) — the collection is closed to
 * browsers by the default-deny Firestore rule.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { allowed } = checkRateLimit(`visitor:${getClientIp(req)}`, 60);
    if (!allowed) return res.status(429).json({ error: 'Too many requests' });

    let uid: string;
    try {
        const header = req.headers.authorization || '';
        if (!header.startsWith('Bearer ')) throw new Error('missing token');
        uid = (await auth.verifyIdToken(header.slice(7))).uid;
    } catch {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const event = req.body?.event === 'whatsapp' ? 'whatsapp' : 'checkout';
    const attribution = sanitizeAttribution(req.body?.attribution);
    const ref = attribution?.ref;
    if (!ref) return res.status(400).json({ error: 'Missing visitor ref' });

    try {
        const docRef = db.collection('visitors').doc(ref);
        const ok = await db.runTransaction(async tx => {
            const snap = await tx.get(docRef);
            // A Ref belongs to the first browser session that claimed it
            if (snap.exists && snap.get('uid') !== uid) return false;
            const { ref: _r, ...rest } = attribution!;
            const update: Record<string, any> = {
                uid,
                updatedAt: FieldValue.serverTimestamp(),
                ...(rest.first || rest.last || rest.fbc || rest.fbp ? { attribution: rest } : {}),
            };
            if (event === 'whatsapp') {
                update.whatsappClicks = FieldValue.increment(1);
                update.lastWhatsAppAt = FieldValue.serverTimestamp();
            } else {
                update.startedCheckout = true;
            }
            // update() replaces the attribution map whole — a merge would mix
            // fields from an old visit into the new one
            if (snap.exists) tx.update(docRef, update);
            else tx.set(docRef, { ...update, createdAt: FieldValue.serverTimestamp() });
            return true;
        });
        if (!ok) return res.status(403).json({ error: 'Ref belongs to another visitor' });
        return res.status(200).json({ ok: true });
    } catch (err: any) {
        console.error('visitor save failed:', err?.message);
        return res.status(500).json({ error: 'Failed to save' });
    }
}
