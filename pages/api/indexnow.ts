import type { NextApiRequest, NextApiResponse } from 'next';
import { db, FieldValue } from '../../src/lib/firebaseAdmin';
import { submitToIndexNow } from '../../src/lib/indexNow';
import { allPagePaths } from '../../src/lib/sitePages';

/**
 * Announce every page of the site to Bing / IndexNow in one go — used after a
 * big update. Day to day, product and blog saves in the admin panel announce
 * their own pages automatically.
 *
 * Open to call, but it only ever submits this site's own pages and runs at
 * most once every 12 hours, so it can't be abused.
 */
const EVERY_MS = 12 * 60 * 60 * 1000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    res.setHeader('Cache-Control', 'no-store');
    try {
        const ref = db.collection('siteMeta').doc('indexNow');
        const last = (await ref.get()).get('lastAllAt');
        const lastMs = last?.toMillis ? last.toMillis() : 0;
        if (Date.now() - lastMs < EVERY_MS) {
            return res.status(200).json({ submitted: 0, skipped: 'Already submitted in the last 12 hours' });
        }
        const paths = await allPagePaths();
        const result = await submitToIndexNow(paths);
        if (result.ok) await ref.set({ lastAllAt: FieldValue.serverTimestamp(), count: result.count }, { merge: true });
        return res.status(200).json({ submitted: result.ok ? result.count : 0, ok: result.ok, status: result.status });
    } catch (err: any) {
        console.error('indexnow failed:', err?.message);
        return res.status(500).json({ error: 'Could not submit pages right now' });
    }
}
