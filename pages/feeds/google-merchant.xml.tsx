import type { GetServerSideProps } from 'next';
import { getCatalog } from '../../src/lib/catalogServer';
import { productImages, visibleProducts } from '../../src/lib/catalog';
import { absoluteUrl } from '../../src/lib/blog';
import { getCDNUrl } from '../../src/services/githubService';

/**
 * Product feed for Google Merchant Center (free Google Shopping listings) —
 * also accepted by Microsoft/Bing Merchant Center. Built from the live
 * catalog, so prices and photos follow the admin panel. In Merchant Center:
 * Products → Feeds → "Scheduled fetch" → this page's address.
 */

const SITE = 'https://wularsports.com';
const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = (n: number) => `${Number(n).toFixed(2)} INR`;

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
    const catalog = await getCatalog();
    const items = visibleProducts(catalog.products).map(p => {
        const images = productImages(p).map(src => absoluteUrl(getCDNUrl(src)));
        const onSale = p.originalPrice > p.price;
        return [
            '<item>',
            `<g:id>${esc(p.sku || p.id)}</g:id>`,
            `<g:title>${esc(`Wular Sports ${p.name.replace(' — ', ' – ')}`.slice(0, 150))}</g:title>`,
            `<g:description>${esc(p.description.slice(0, 4900))}</g:description>`,
            `<g:link>${SITE}/product/${esc(p.id)}</g:link>`,
            images[0] ? `<g:image_link>${esc(images[0])}</g:image_link>` : '',
            ...images.slice(1, 10).map(u => `<g:additional_image_link>${esc(u)}</g:additional_image_link>`),
            '<g:availability>in_stock</g:availability>',
            '<g:condition>new</g:condition>',
            `<g:price>${money(onSale ? p.originalPrice : p.price)}</g:price>`,
            onSale ? `<g:sale_price>${money(p.price)}</g:sale_price>` : '',
            '<g:brand>Wular Sports</g:brand>',
            p.sku ? `<g:mpn>${esc(p.sku)}</g:mpn>` : '<g:identifier_exists>no</g:identifier_exists>',
            '<g:google_product_category>Sporting Goods &gt; Athletics &gt; Cricket &gt; Cricket Bats</g:google_product_category>',
            `<g:product_type>${esc(`Cricket Bats > ${p.category.join(' & ')}`)}</g:product_type>`,
            '<g:material>Kashmir willow</g:material>',
            '<g:shipping><g:country>IN</g:country><g:price>0.00 INR</g:price></g:shipping>',
            '</item>',
        ].filter(Boolean).join('\n');
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>Wular Sports — Kashmir Willow Cricket Bats</title>
<link>${SITE}</link>
<description>Handcrafted Kashmir willow cricket bats from Srinagar, Kashmir</description>
${items.join('\n')}
</channel>
</rss>
`;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', catalog.failed ? 'public, s-maxage=300' : 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.write(xml);
    res.end();
    return { props: {} };
};

export default function MerchantFeed() {
    return null;
}
