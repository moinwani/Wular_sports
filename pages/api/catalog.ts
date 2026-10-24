import type { NextApiRequest, NextApiResponse } from 'next';
import { getCatalog } from '../../src/lib/catalogServer';
import { toPublicCatalog } from '../../src/lib/catalog';

/** Public catalog (visible products + categories) for pages that don't build it in. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const catalog = await getCatalog();
    // Short CDN cache: admin edits show up within about a minute
    res.setHeader('Cache-Control', catalog.failed ? 'no-store' : 'public, s-maxage=60, stale-while-revalidate=600');
    return res.status(200).json(toPublicCatalog(catalog));
}
