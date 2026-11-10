import { getCatalog } from './catalogServer';
import { getBlog } from './blogServer';
import { visibleProducts } from './catalog';
import { livePosts } from './blog';

/** Fixed pages worth showing to search engines (the rest are built from the catalog and blog) */
export const STATIC_PAGES = [
    '/', '/collection', '/tennis-cricket-bats', '/hard-tennis-bats', '/soft-tennis-bats', '/leather-cricket-bats',
    '/comparison', '/blog', '/about', '/return-policy', '/privacy-policy', '/terms-conditions',
];

/** Every public page path on the site right now */
export async function allPagePaths(): Promise<string[]> {
    const [catalog, blog] = await Promise.all([getCatalog(), getBlog()]);
    return [...new Set([
        ...STATIC_PAGES,
        ...catalog.categories.map(c => c.path),
        ...visibleProducts(catalog.products).map(p => `/product/${p.id}`),
        ...livePosts(blog.posts).map(p => `/blog/${p.id}`),
    ])];
}
