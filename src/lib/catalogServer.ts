import { products as BUILT_IN_PRODUCTS } from '../data/products';
import { Catalog, DEFAULT_CATEGORIES, PublicCatalog, sortCategories, toPublicCatalog } from './catalog';
import type { ProductFull } from '../types';

/**
 * Server-side catalog: products + categories from Firestore (managed in
 * Admin → Products), or the built-in list until the owner starts managing
 * them. Cached briefly per server instance; admin saves clear the cache.
 *
 * Firebase Admin is imported lazily so pages still build and render from the
 * built-in list when credentials or Firestore are unavailable.
 */

const TTL_MS = 30_000;
let cache: { at: number; catalog: Catalog } | null = null;

export const BUILT_IN_CATALOG: Catalog = { products: BUILT_IN_PRODUCTS, categories: DEFAULT_CATEGORIES, managed: false };

/** Drop Firestore timestamps so the data can be passed to pages as JSON. */
const plain = ({ updatedAt: _u, createdAt: _c, ...rest }: Record<string, any>) => rest;

export async function getCatalog(opts: { fresh?: boolean } = {}): Promise<Catalog> {
    if (!opts.fresh && cache && Date.now() - cache.at < TTL_MS) return cache.catalog;
    try {
        const { db } = await import('./firebaseAdmin');
        const [p, c] = await Promise.all([db.collection('products').get(), db.collection('categories').get()]);
        const catalog: Catalog = p.empty
            ? BUILT_IN_CATALOG
            : {
                products: p.docs.map(d => ({ ...plain(d.data()), id: d.id }) as ProductFull),
                categories: c.empty ? DEFAULT_CATEGORIES : sortCategories(c.docs.map(d => ({ ...plain(d.data()), id: d.id }) as any)),
                managed: true,
            };
        cache = { at: Date.now(), catalog };
        return catalog;
    } catch (err: any) {
        console.error('Catalog: Firestore unavailable, using the built-in list —', err?.message);
        return cache?.catalog || { ...BUILT_IN_CATALOG, failed: true };
    }
}

/**
 * Catalog for a page's getStaticProps. If Firestore is down while a page is
 * being refreshed, throwing makes Next.js keep serving the last good page
 * instead of swapping in the built-in list.
 */
export async function catalogForPage(): Promise<Catalog> {
    // Always fresh: a page refreshed right after an admin save must show the new data
    const catalog = await getCatalog({ fresh: true });
    if (catalog.failed && process.env.NEXT_PHASE !== 'phase-production-build') {
        throw new Error('Catalog unavailable — keeping the previous version of this page');
    }
    return catalog;
}

/** How often pages re-check the catalog even without an admin save (seconds) */
export const PAGE_REVALIDATE_SECONDS = 600;

export const invalidateCatalog = () => { cache = null; };

/** getStaticProps helper: { catalog } for the page, plus how often to refresh it */
export async function catalogPageProps(): Promise<{ catalog: PublicCatalog }> {
    return { catalog: toPublicCatalog(await catalogForPage()) };
}
