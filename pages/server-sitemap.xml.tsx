import type { GetServerSideProps } from 'next';
import { getCatalog } from '../src/lib/catalogServer';
import { getBlog } from '../src/lib/blogServer';
import { visibleProducts } from '../src/lib/catalog';
import { isoDateOf, livePosts } from '../src/lib/blog';

/**
 * Live sitemap for everything managed in the admin panel — products, new
 * categories and blog posts — so Google finds new pages without a redeploy.
 * The fixed pages are in /sitemap.xml (next-sitemap); robots.txt lists both.
 */

const SITE = 'https://wularsports.com';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
    const [catalog, blog] = await Promise.all([getCatalog(), getBlog()]);
    const today = new Date().toISOString().slice(0, 10);
    const urls: { loc: string; lastmod: string; priority: string; changefreq: string }[] = [
        ...visibleProducts(catalog.products).map(p => ({ loc: `/product/${p.id}`, lastmod: today, priority: '0.9', changefreq: 'weekly' })),
        ...catalog.categories.filter(c => !c.builtIn).map(c => ({ loc: c.path, lastmod: today, priority: '0.8', changefreq: 'weekly' })),
        ...livePosts(blog.posts).map(p => ({ loc: `/blog/${p.id}`, lastmod: isoDateOf(p) || today, priority: '0.6', changefreq: 'monthly' })),
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
        .map(u => `  <url><loc>${esc(SITE + u.loc)}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`)
        .join('\n')}\n</urlset>\n`;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    // Fresh within the hour; never cache a stand-in list from a Firestore outage for long
    res.setHeader('Cache-Control', catalog.failed || blog.failed ? 'public, s-maxage=300' : 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.write(xml);
    res.end();
    return { props: {} };
};

export default function ServerSitemap() {
    return null;
}
