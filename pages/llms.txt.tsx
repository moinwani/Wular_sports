import type { GetServerSideProps } from 'next';
import { getCatalog } from '../src/lib/catalogServer';
import { getBlog } from '../src/lib/blogServer';
import { sortCategories, visibleProducts, productsIn } from '../src/lib/catalog';
import { livePosts } from '../src/lib/blog';
import { TENNIS_HUB, homeFaq, priceRange, shortName, specOf } from '../src/lib/seoContent';

/**
 * /llms.txt — a plain-text summary of the shop for AI assistants (ChatGPT,
 * Claude, Perplexity, Gemini…). Built from the live catalog and blog, so the
 * bats, prices and guides they read are always the current ones.
 */

const SITE = 'https://wularsports.com';
const inr = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
    const [catalog, blog] = await Promise.all([getCatalog(), getBlog()]);
    const products = visibleProducts(catalog.products);
    const categories = sortCategories(catalog.categories);
    const posts = livePosts(blog.posts);

    const productLine = (p: (typeof products)[number]) => {
        const bits = [
            p.category.join(' / '),
            specOf(p, 'wood'),
            specOf(p, 'weight'),
            specOf(p, 'edge') && `${specOf(p, 'edge')} edges`,
            specOf(p, 'scoop profile'),
            inr(p.price),
        ].filter(Boolean);
        return `- [${shortName(p)}](${SITE}/product/${p.id}): ${bits.join(', ')}`;
    };

    const text = [
        '# Wular Sports',
        '',
        '> Handcrafted Kashmir willow cricket bats — hard tennis, soft tennis and leather ball — made in Srinagar, Kashmir, India and sold online with free delivery across India.',
        '',
        'Wular Sports is a cricket bat maker based in Srinagar, Jammu and Kashmir, India, specialising in Kashmir willow bats for tennis ball cricket (hard tennis and soft tennis / tape ball) and for leather ball cricket. Founded by Moin Wani. Every bat is made from naturally seasoned Kashmir willow, hard-pressed, fitted with a cane handle, and shipped knocked-in and oiled with a bat cover, toe guard and extra grip.',
        '',
        '## Key facts',
        '',
        `- Price range: ${priceRange(products)} (Indian rupees), free delivery across India included`,
        '- Delivery: dispatched within 24 hours by India Post, usually 6–7 business days',
        '- Payment: online (UPI, cards, net banking) or cash on delivery with a ₹500 per bat booking; a 5% COD fee applies to the balance',
        '- Returns: within 7 days of delivery',
        '- Sizes: most bats come in 35 inch and 36 inch',
        '- Custom bats: weight, blade, handle, finish and stickers can be customised to order',
        '- Orders and questions: WhatsApp +91 93206 22451, wularsports@gmail.com',
        '',
        '## Shop by category',
        '',
        `- [${TENNIS_HUB.title}](${SITE}${TENNIS_HUB.path}): every tennis ball bat, hard and soft, with a comparison table`,
        ...categories.map(c => {
            const inCat = productsIn(products, c);
            return `- [${c.title}](${SITE}${c.path}): ${c.description}${inCat.length ? ` Price: ${priceRange(inCat)}.` : ''}`;
        }),
        '',
        '## Bats',
        '',
        ...products.map(productLine),
        '',
        '## Buying guides',
        '',
        ...posts.slice(0, 40).map(p => `- [${p.title}](${SITE}/blog/${p.id}): ${p.description}`),
        '',
        '## Common questions',
        '',
        ...homeFaq(products).flatMap(f => [`### ${f.question}`, f.answer, '']),
        '## More',
        '',
        `- [Bat comparison](${SITE}/comparison): Wular Sports hard tennis bats side by side and against other Kashmiri brands`,
        `- [About Wular Sports](${SITE}/about): the workshop, the craft and the people`,
        `- [Return policy](${SITE}/return-policy)`,
        '- Instagram: https://www.instagram.com/wular.sports',
        '- YouTube: https://youtube.com/@wularsports',
        '',
    ].join('\n');

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', catalog.failed || blog.failed ? 'public, s-maxage=300' : 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.write(text);
    res.end();
    return { props: {} };
};

export default function LlmsTxt() {
    return null;
}
