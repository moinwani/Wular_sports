import type { ProductFull } from '../types';

/**
 * Catalog shapes and rules shared by the website, the admin panel and the
 * API routes. Pure code (no imports beyond types) so it runs anywhere.
 *
 * Products and categories live in Firestore once the owner starts managing
 * them from the admin panel; until then the built-in list in
 * src/data/products.ts is used.
 */

export interface Category {
    /** URL-safe id, e.g. "hard-tennis" */
    id: string;
    /** Name products are tagged with, e.g. "Hard Tennis" */
    name: string;
    /** Short label in the menu, e.g. "Hard Tennis" */
    navLabel: string;
    /** Page heading, e.g. "Hard Tennis Bats" */
    title: string;
    /** Longer H1 for search engines */
    h1: string;
    /** One or two sentences under the heading (also the search description) */
    description: string;
    /** Longer text shown on the category page (good for Google) */
    bodyText?: string;
    keywords?: string;
    /** Website address of the category page */
    path: string;
    order: number;
    showInNav: boolean;
    /** The three original pages keep their fixed addresses */
    builtIn?: boolean;
}

export interface Catalog {
    products: ProductFull[];
    categories: Category[];
    /** true once the owner manages products in the admin panel (Firestore) */
    managed: boolean;
    /** Firestore couldn't be reached — this is the built-in list as a stand-in */
    failed?: boolean;
}

/** What the website gets: visible products + categories in menu order */
export interface PublicCatalog {
    products: ProductFull[];
    categories: Category[];
}

export const DEFAULT_CATEGORIES: Category[] = [
    {
        id: 'hard-tennis', name: 'Hard Tennis', navLabel: 'Hard Tennis', title: 'Hard Tennis Bats',
        h1: "Hard Tennis Cricket Bats by Wular Sports",
        description: "Discover premium handcrafted hard tennis cricket bats made from Kashmiri willow. Optimized for power play and tournament performance.",
        keywords: "hard tennis bat, hard tennis cricket bat, kashmiri willow hard tennis bat, scoop bat hard tennis",
        bodyText: "Hard tennis cricket is one of the most popular formats of the game across India, played with a heavy tennis ball that demands both power and precision from your bat. Our handcrafted Kashmiri willow hard tennis bats are specifically engineered for this format — each bat is shaped, balanced, and finished by master craftsmen in Srinagar, Kashmir using traditional techniques passed down through generations. Whether you play weekend tournaments or competitive leagues, the dense grain structure of Kashmiri willow gives you the durability and raw power you need to clear boundaries effortlessly. Our hard tennis bats feature premium Singapore cane handles for superior shock absorption and a comfortable grip that lets you play long innings without fatigue. Available in both scoop and non-scoop profiles, every bat comes fully knocked-in and match-ready with a bat cover, toe guard, and extra grip — so you can step onto the field the moment your order arrives.",
        path: '/hard-tennis-bats', order: 1, showInNav: true, builtIn: true,
    },
    {
        id: 'soft-tennis', name: 'Soft Tennis', navLabel: 'Soft Tennis', title: 'Soft Tennis Bats',
        h1: "Soft Tennis Cricket Bats by Wular Sports",
        description: "Lightweight and powerful soft tennis bats for explosive hitting and control. Handcrafted Kashmiri willow with honeycomb scoop design.",
        keywords: "soft tennis bat, soft tennis cricket bat, honeycomb scoop bat, tape ball bat, kashmiri willow soft tennis",
        bodyText: "Soft tennis cricket, also known as tape ball cricket, requires bats that are lightweight yet explosive — and that's exactly what our Kashmiri willow soft tennis bats deliver. Unlike heavier hard tennis bats, soft tennis bats are designed with a thinner profile and a lighter pickup weight, allowing for faster bat speeds and quicker reaction times against the swinging tape ball. Our signature honeycomb scoop design removes excess wood from the back of the blade, reducing overall weight while maintaining a massive sweet spot for power hitting. Every bat is handcrafted in our Srinagar workshop from carefully selected Kashmiri willow clefts, oiled, pressed, and knocked-in over several days to ensure peak performance from the very first ball. The result is a bat that feels effortless in your hands yet generates explosive power — perfect for tape ball tournaments, gully cricket, and casual matches. Each bat includes a free bat cover, toe guard, and grip, with free shipping anywhere in India.",
        path: '/soft-tennis-bats', order: 2, showInNav: true, builtIn: true,
    },
    {
        id: 'leather-ball', name: 'Leather Ball', navLabel: 'Leather Bats', title: 'Leather Cricket Bats',
        h1: "Leather Cricket Bats by Wular Sports",
        description: "Professional leather ball cricket bats handcrafted from the finest Grade A+ Kashmir willow. Built for serious cricket.",
        keywords: "leather cricket bat, leather ball bat, professional cricket bat, kashmiri willow leather bat, Grade A willow bat",
        bodyText: "For cricketers who play with a leather ball — whether in club matches, district tournaments, or professional leagues — a high-quality leather cricket bat is essential. Our leather ball bats are crafted from the finest Grade A+ Kashmiri willow, selected for its straight grains, clean appearance, and excellent performance characteristics. Each cleft is seasoned for over 12 months before being shaped by hand in our Srinagar workshop, where master craftsmen apply decades of expertise to create bats with the perfect balance of weight distribution, edge profile, and spine height. The dense Kashmiri willow used in our leather bats offers exceptional durability and a responsive middle that generates impressive ping and shot power against the hard leather ball. Equipped with a premium Singapore cane handle for superior vibration dampening and a comfortable double-grip setup, these bats are tournament-ready right out of the box. Every leather bat includes complimentary knocking-in and oiling, plus a free bat cover, toe guard, and extra grip with free delivery across India.",
        path: '/leather-cricket-bats', order: 3, showInNav: true, builtIn: true,
    },
];

export const slugify = (s: string) =>
    String(s || '').toLowerCase().normalize('NFKD').replace(/[^\w\s.-]/g, '').trim()
        .replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

export const productImages = (p: Pick<ProductFull, 'image'>): string[] =>
    (Array.isArray(p.image) ? p.image : p.image ? [p.image] : []).filter(Boolean);

/** "Legacy Edition 2.0 — Kashmiri Willow Hard Tennis Bat" → ["Legacy Edition 2.0", "Kashmiri Willow Hard Tennis Bat"] */
export const splitProductName = (name: string): [string, string] => {
    const i = name.indexOf(' — ');
    return i > 0 ? [name.slice(0, i).trim(), name.slice(i + 3).trim()] : [name, ''];
};

/** Up to `max` short selling points from the specs ("Weight: 980–1100 grams" → "980–1100 grams") */
export const productHighlights = (p: Pick<ProductFull, 'specs'>, max = 4): { label: string; value: string }[] => {
    const wanted = ['wood', 'weight', 'scoop profile', 'handle', 'edge', 'processing'];
    const parsed = (p.specs || []).map(s => {
        const i = s.indexOf(':');
        return i > 0 ? { label: s.slice(0, i).trim(), value: s.slice(i + 1).trim() } : null;
    }).filter((x): x is { label: string; value: string } => !!x && !!x.value);
    return wanted
        .map(w => parsed.find(x => x.label.toLowerCase() === w))
        .filter((x): x is { label: string; value: string } => !!x)
        .slice(0, max);
};

/** Categories in menu order */
export const sortCategories = (cats: Category[]) => [...cats].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

/** Products shown on the website (hidden ones are only visible in the admin panel) */
export const visibleProducts = (products: ProductFull[]) =>
    products.filter(p => !p.hidden).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

export const toPublicCatalog = (c: { products: ProductFull[]; categories: Category[] }): PublicCatalog => ({
    products: visibleProducts(c.products),
    categories: sortCategories(c.categories),
});

export const productsIn = (products: ProductFull[], category: Pick<Category, 'name'>) =>
    visibleProducts(products).filter(p => p.category.includes(category.name));

/**
 * Sizes a customer picks from. A product's own list wins; older products
 * fall back to the original rule (35/36 inch bats, AK-47 only 35 inch).
 */
export const productSizes = (p: ProductFull): string[] => {
    if (Array.isArray(p.sizes)) return p.sizes;
    if (p.id === 'ak-47-honeycomb') return ['35 inch'];
    return p.category.some(c => ['Hard Tennis', 'Soft Tennis', 'Leather Ball'].includes(c)) ? ['35 inch', '36 inch'] : [];
};

/* ───────────── Validation (API routes store only clean data) ───────────── */

class CatalogError extends Error {}
export { CatalogError };
const fail = (msg: string): never => { throw new CatalogError(msg); };
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const isUrl = (v: unknown): v is string => typeof v === 'string' && /^https:\/\/[^\s"'<>]+$/.test(v) && v.length <= 600;
/** Photo address: a full https link, or one served by our own /api/photo/ route (private photo store) */
const isPhoto = (v: unknown): v is string => isUrl(v) || (typeof v === 'string' && /^\/api\/photo\/[\w./%-]+$/.test(v) && v.length <= 600);

export function cleanProduct(raw: any, categoryNames: string[], isNew: boolean): ProductFull {
    const name = str(raw?.name, 140) || fail('Give the product a name');
    const id = isNew ? (slugify(raw?.id || name) || fail('Could not make a web address from the name')) : str(raw?.id, 80);
    if (!/^[a-z0-9][a-z0-9.-]*$/.test(id)) fail('Web address can only use small letters, numbers, dots and dashes');
    const price = Number(raw?.price);
    if (!Number.isFinite(price) || price < 1 || price > 1_000_000) fail('Price must be between ₹1 and ₹10,00,000');
    const originalPrice = raw?.originalPrice === '' || raw?.originalPrice == null ? price : Number(raw.originalPrice);
    if (!Number.isFinite(originalPrice) || originalPrice < price) fail('“Original price” must be the same as or higher than the selling price');
    const category: string[] = Array.isArray(raw?.category) ? raw.category.filter((c: unknown) => typeof c === 'string' && categoryNames.includes(c)) : [];
    if (!category.length) fail('Pick at least one category');
    const images = (Array.isArray(raw?.image) ? raw.image : []).filter(isPhoto).slice(0, 20);
    if (!images.length) fail('Add at least one photo');
    const specs = (Array.isArray(raw?.specs) ? raw.specs : []).map((s: unknown) => str(s, 200)).filter(Boolean).slice(0, 40);
    const sizes = Array.isArray(raw?.sizes) ? raw.sizes.map((s: unknown) => str(s, 30)).filter(Boolean).slice(0, 12) : undefined;
    const videoUrl = str(raw?.videoUrl, 300);
    if (videoUrl && !isUrl(videoUrl)) fail('Video link must start with https://');

    const out: ProductFull = {
        id,
        name,
        category: category as ProductFull['category'],
        description: str(raw?.description, 6000) || fail('Add a description'),
        image: images,
        price: Math.round(price),
        originalPrice: Math.round(originalPrice),
        specs,
        hidden: raw?.hidden === true,
        order: Number.isFinite(Number(raw?.order)) ? Number(raw.order) : 999,
    };
    const sku = str(raw?.sku, 40);
    if (sku) out.sku = sku;
    if (sizes) out.sizes = sizes;
    if (videoUrl) out.videoUrl = videoUrl;
    if (raw?.aggregateRating && typeof raw.aggregateRating === 'object') out.aggregateRating = raw.aggregateRating;
    return out;
}

export function cleanCategory(raw: any, isNew: boolean): Category {
    const title = str(raw?.title, 80) || fail('Give the category a title, e.g. “Kids Bats”');
    const name = str(raw?.name, 60) || title.replace(/\s+bats?$/i, '').trim() || title;
    const id = isNew ? (slugify(raw?.id || name) || fail('Could not make a web address')) : str(raw?.id, 60);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) fail('Web address can only use small letters, numbers and dashes');
    return {
        id,
        name,
        navLabel: str(raw?.navLabel, 40) || name,
        title,
        h1: str(raw?.h1, 140) || `${title} by Wular Sports`,
        description: str(raw?.description, 400) || `Handcrafted Kashmiri willow ${title.toLowerCase()} from Wular Sports.`,
        bodyText: str(raw?.bodyText, 4000),
        keywords: str(raw?.keywords, 300),
        path: raw?.builtIn ? str(raw?.path, 80) : `/category/${id}`,
        order: Number.isFinite(Number(raw?.order)) ? Number(raw.order) : 99,
        showInNav: raw?.showInNav !== false,
        ...(raw?.builtIn ? { builtIn: true } : {}),
    };
}
