import type { NextApiRequest, NextApiResponse } from 'next';
import { db, FieldValue } from '../../../src/lib/firebaseAdmin';
import { isAdminRequest } from '../../../src/lib/adminAuth';

/**
 * Admin-only store for CRM data the shop owner adds: tags, notes and a
 * WhatsApp contact log per customer. Uses the Admin SDK, so the
 * `customerProfiles` collection stays closed to the public by the default
 * deny rule — no Firestore rules change needed.
 *
 *  GET                                    → { profiles: { [key]: profile } }
 *  POST { key, tags?, notes? }            → update tags / notes
 *  POST { key, contact: { template } }    → log a WhatsApp contact
 */

const COLLECTION = 'customerProfiles';
const MAX_CONTACTS = 30;

const safeKey = (k: unknown) =>
    typeof k === 'string' && k.length > 0 && k.length <= 200 ? k.replace(/\//g, '_') : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!(await isAdminRequest(req))) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    if (req.method === 'GET') {
        const snap = await db.collection(COLLECTION).limit(5000).get();
        const profiles: Record<string, any> = {};
        snap.docs.forEach(d => { profiles[d.id] = d.data(); });
        return res.status(200).json({ profiles });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { key, tags, notes, contact } = req.body || {};
    const id = safeKey(key);
    if (!id) return res.status(400).json({ error: 'Invalid customer key' });

    const ref = db.collection(COLLECTION).doc(id);
    const update: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() };

    if (Array.isArray(tags)) {
        update.tags = [...new Set(tags.map(t => String(t).trim().slice(0, 40)).filter(Boolean))].slice(0, 20);
    }
    if (typeof notes === 'string') {
        update.notes = notes.slice(0, 2000);
    }

    if (contact && typeof contact.template === 'string') {
        const at = new Date().toISOString();
        const snap = await ref.get();
        const prev: any[] = (snap.exists && snap.data()?.contacts) || [];
        update.contacts = [{ at, template: contact.template.slice(0, 40) }, ...prev].slice(0, MAX_CONTACTS);
        update.lastContactedAt = at;
    }

    await ref.set(update, { merge: true });
    const saved = (await ref.get()).data() || {};
    delete saved.updatedAt;
    return res.status(200).json({ profile: saved });
}
