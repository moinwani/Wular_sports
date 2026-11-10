import type { ProductFull } from '../types';
import { splitProductName } from './catalog';

/**
 * Search content shared by the category pages, the tennis-bat hub, the
 * homepage and /llms.txt: page titles written around what people type into
 * Google ("hard tennis cricket bat", "kashmir willow bat price"…) and short,
 * factual question-and-answer blocks. The answers stand on their own — that is
 * the form Google's AI answers, ChatGPT, Claude and Perplexity quote from.
 *
 * Prices and bat names are filled in from the live catalog, so nothing here
 * goes stale when a price changes in the admin panel.
 */

export interface Faq { question: string; answer: string }
export interface Guide { id: string; title: string }

const inr = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/** "Weight: 980–1100 grams" → "980–1100 grams" for the first matching spec label */
export const specOf = (p: Pick<ProductFull, 'specs'>, ...labels: string[]): string => {
    for (const s of p.specs || []) {
        const i = s.indexOf(':');
        if (i <= 0) continue;
        const label = s.slice(0, i).trim().toLowerCase();
        if (labels.some(l => label === l || label.startsWith(l))) return s.slice(i + 1).trim();
    }
    return '';
};

export const shortName = (p: Pick<ProductFull, 'name'>) => splitProductName(p.name)[0];

export const minPrice = (products: Pick<ProductFull, 'price'>[]) =>
    products.length ? Math.min(...products.map(p => p.price)) : 0;

/** "₹2,799 to ₹3,999" (or one price) */
export const priceRange = (products: Pick<ProductFull, 'price'>[]): string => {
    if (!products.length) return '';
    const prices = products.map(p => p.price);
    const min = Math.min(...prices), max = Math.max(...prices);
    return min === max ? inr(min) : `${inr(min)} to ${inr(max)}`;
};

const nameList = (products: Pick<ProductFull, 'name'>[]): string => {
    const names = products.map(shortName);
    return names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
};

/** Page <title> for a category: keyword first, live starting price, brand last */
export const categoryPageTitle = (seoTitle: string, products: Pick<ProductFull, 'price'>[]) =>
    `${seoTitle}${products.length ? ` from ${inr(minPrice(products))}` : ''} | Wular Sports`;

const DELIVERY: Faq = {
    question: 'How long does delivery take, and is cash on delivery available?',
    answer: 'Every order is dispatched within 24 hours by India Post and usually arrives in 6–7 business days, with free delivery anywhere in India. Cash on delivery is available: you pay a ₹500 booking per bat online and the rest at your door (a 5% COD fee applies to the balance). Returns are accepted within 7 days of delivery.',
};

const READY: Faq = {
    question: 'Do the bats come knocked-in and ready to play?',
    answer: 'Yes. Every Wular Sports bat is knocked-in and oiled in our Srinagar workshop before dispatch, and ships with a bat cover, toe guard and an extra grip, so it is match-ready out of the box.',
};

const priceFaq = (what: string, products: ProductFull[]): Faq[] => products.length ? [{
    question: `What is the price of a ${what}?`,
    answer: `Wular Sports ${what}s cost ${priceRange(products)}${products.length > 1 ? `, depending on the model (${nameList(products)})` : ''}. The price includes free delivery across India, a bat cover, toe guard and an extra grip.`,
}] : [];

interface CategorySeo {
    /** Leads the <title>; the starting price and brand are added after it */
    seoTitle: string;
    /** Blog posts whose title matches are linked as "Buying guides" */
    guides: RegExp;
    faqHeading: string;
    faq: (products: ProductFull[]) => Faq[];
}

export const CATEGORY_SEO: Record<string, CategorySeo> = {
    'hard-tennis': {
        seoTitle: 'Kashmir Willow Hard Tennis Cricket Bats',
        guides: /hard tennis|scoop|tennis (ball )?cricket bat/i,
        faqHeading: 'Hard tennis cricket bats: common questions',
        faq: products => [
            {
                question: 'Which bat is best for hard tennis ball cricket?',
                answer: `A Kashmir willow bat of about 950–1100 grams with thick 46–52 mm edges is the standard choice for hard tennis ball cricket. Kashmir willow is dense enough to take heavy 130–140 g tennis balls without cracking.${products.length ? ` Wular Sports currently makes ${products.length} hard tennis ${products.length === 1 ? 'bat' : 'bats'}: ${nameList(products)}.` : ''}`,
            },
            {
                question: 'What is the ideal weight for a hard tennis bat?',
                answer: 'Most players do best between 950 and 1100 grams. A lighter bat (950–1000 g) gives faster bat speed and easier wrist shots; a heavier bat (1050–1100 g) carries the ball further on big hits. Pick the heaviest bat you can still swing freely through a full innings.',
            },
            {
                question: 'Scoop or non-scoop: which is better for hard tennis cricket?',
                answer: 'A scoop bat has wood removed from the back, which lightens the pickup while keeping thick edges, so it suits fast swings and lofted shots. A non-scoop (flat, full-profile) bat keeps more wood behind the ball, so it feels more solid and powerful but picks up heavier. Choose a scoop for bat speed and a non-scoop for raw power.',
            },
            {
                question: 'Is Kashmir willow good for hard tennis ball cricket?',
                answer: 'Yes. Kashmir willow is denser and harder than English willow, so it lasts longer against heavy tennis balls and rough grounds, and it costs far less. That is why most hard tennis bats sold in India are made from Kashmir willow.',
            },
            ...priceFaq('hard tennis cricket bat', products),
            READY,
            DELIVERY,
        ],
    },
    'soft-tennis': {
        seoTitle: 'Kashmir Willow Soft Tennis Cricket Bats',
        guides: /soft tennis|tape ball|tennis (ball )?cricket bat/i,
        faqHeading: 'Soft tennis cricket bats: common questions',
        faq: products => [
            {
                question: 'What is a soft tennis cricket bat?',
                answer: 'A soft tennis bat is a lighter cricket bat, usually 820–950 grams, made for light tennis balls and tape ball cricket. It has thinner edges than a hard tennis bat and often a scoop on the back, so it swings fast and is easy to control.',
            },
            {
                question: 'Can I use a soft tennis bat with a hard tennis ball?',
                answer: 'It is not recommended. Hard tennis balls weigh about 130–140 grams, much more than a light tennis or tape ball, and a light soft tennis bat can crack or lose its ping against them. For heavy tennis balls, use a hard tennis bat of 950–1100 grams.',
            },
            {
                question: 'What is a honeycomb scoop bat?',
                answer: 'A honeycomb scoop has small pockets of wood removed from the back of the blade in a honeycomb pattern. This cuts weight and speeds up the swing while leaving the edges and the sweet spot intact.',
            },
            {
                question: 'What bat weight is best for tape ball cricket?',
                answer: 'Around 820–950 grams. Tape ball and light tennis ball cricket reward bat speed more than bat mass, so a light bat with a good pickup lets you hit the ball later and harder.',
            },
            ...priceFaq('soft tennis cricket bat', products),
            READY,
            DELIVERY,
        ],
    },
    'leather-ball': {
        seoTitle: 'Kashmir Willow Leather Ball Cricket Bats',
        guides: /leather|english willow|grade|care|maintenance|knock/i,
        faqHeading: 'Leather ball cricket bats: common questions',
        faq: products => [
            {
                question: 'Is a Kashmir willow bat good for leather ball cricket?',
                answer: 'Yes, for club, school, academy and league cricket. A good Kashmir willow leather bat is harder and more durable than English willow and costs a fraction of the price. English willow is lighter with more rebound, which is why it is used at professional level, but it is not needed to play good leather ball cricket.',
            },
            {
                question: 'How many grains should a Kashmir willow leather bat have?',
                answer: 'Good Kashmir willow usually shows 5 to 12 straight grains on the face. The number matters less than the grains being straight and evenly spaced, with a clean face free of knots and cracks.',
            },
            {
                question: 'What weight should a leather ball cricket bat be?',
                answer: 'Most adult leather ball bats weigh between 1150 and 1250 grams. Choose a weight you can lift and swing comfortably for a long innings; pickup and balance matter more than the number on the scale.',
            },
            {
                question: 'Do I need to knock in a Kashmir willow leather bat?',
                answer: 'Wular Sports leather bats arrive knocked-in and oiled. It is still wise to play one or two net sessions against an older, softer ball before using the bat against a new leather ball in a match.',
            },
            ...priceFaq('leather ball cricket bat', products),
            DELIVERY,
        ],
    },
};

/** The /tennis-cricket-bats hub: every tennis-ball bat, hard and soft */
export const TENNIS_HUB = {
    path: '/tennis-cricket-bats',
    title: 'Tennis Cricket Bats',
    seoTitle: 'Tennis Ball Cricket Bats (Hard & Soft)',
    h1: 'Tennis Cricket Bats for Hard & Soft Tennis Ball',
    description: 'Kashmir willow tennis cricket bats handcrafted in Srinagar: heavier bats for hard tennis ball, lighter scoop bats for soft tennis and tape ball. Free delivery across India.',
    keywords: 'tennis cricket bat, tennis ball cricket bat, tennis bat for cricket, hard tennis bat, soft tennis bat, tape ball bat, kashmir willow tennis bat',
    bodyText: 'Tennis ball cricket is the most played form of the game in India, and the right bat depends on the ball. Hard tennis ball cricket uses a heavy ball of about 130–140 grams, so it needs a dense Kashmir willow bat of roughly 950–1100 grams with thick edges that will not crack. Soft tennis and tape ball cricket use a much lighter ball, where a lighter bat of 820–950 grams with a scooped back gives the bat speed that matters most. Every Wular Sports tennis bat is handcrafted in Srinagar, Kashmir from seasoned Kashmir willow, hard-pressed for durability, fitted with a cane handle, and shipped knocked-in and oiled with a bat cover, toe guard and extra grip. Use the comparison table to match weight, edge thickness and profile to the ball you play with.',
    guides: /tennis|scoop|tape ball/i,
    faqHeading: 'Tennis cricket bats: common questions',
    faq: (products: ProductFull[]): Faq[] => [
        {
            question: 'Which bat is best for tennis ball cricket?',
            answer: 'It depends on the ball. For a heavy (hard) tennis ball of 130–140 grams, use a Kashmir willow hard tennis bat of 950–1100 grams with 46–52 mm edges. For a light tennis ball or tape ball, use a soft tennis bat of 820–950 grams, ideally with a scoop for faster bat speed.',
        },
        {
            question: 'What is the difference between a hard tennis bat and a soft tennis bat?',
            answer: 'A hard tennis bat is heavier (about 950–1100 g) with thicker edges and hard-pressed willow, built to hit heavy tennis balls without damage. A soft tennis bat is lighter (about 820–950 g) with thinner edges and a deeper scoop, built for bat speed against light tennis and tape balls.',
        },
        {
            question: 'Can I use a leather ball bat for tennis ball cricket?',
            answer: 'You can, but it is not ideal. Leather ball bats weigh 1150–1250 grams and are shaped for a hard leather ball, so they feel slow against a tennis ball. A tennis cricket bat is lighter and has a profile designed for the lighter ball.',
        },
        {
            question: 'Is Kashmir willow or English willow better for tennis ball cricket?',
            answer: 'Kashmir willow. It is denser and tougher than English willow, so it stands up to heavy tennis balls, concrete pitches and rough grounds, and it costs far less. English willow is softer and is made for leather ball cricket.',
        },
        ...(products.length ? [{
            question: 'What is the price of a tennis cricket bat?',
            answer: `Wular Sports tennis cricket bats cost ${priceRange(products)} (${nameList(products)}). The price includes free delivery across India, a bat cover, toe guard and an extra grip.`,
        }] : []),
        READY,
        DELIVERY,
    ],
};

/** Homepage: the questions people ask about Kashmir willow bats in general */
export const homeFaq = (products: ProductFull[]): Faq[] => [
    {
        question: 'What is a Kashmir willow cricket bat?',
        answer: 'A Kashmir willow bat is made from white willow grown in the Kashmir Valley of India. It is the main alternative to English willow: denser, harder and more durable, and much more affordable. Kashmir willow bats are used for tennis ball cricket and for club-level leather ball cricket across India.',
    },
    {
        question: 'Is a Kashmir willow bat good?',
        answer: 'Yes. A well-made Kashmir willow bat with seasoned wood, proper pressing and a cane handle performs very well for tennis ball cricket and club leather ball cricket, and it usually outlasts English willow on hard Indian pitches. Quality depends on the grade of the cleft, how long it was seasoned and how it was pressed.',
    },
    {
        question: 'What is the difference between Kashmir willow and English willow?',
        answer: 'English willow is lighter and softer with more rebound, which suits professional leather ball cricket but makes it expensive and less durable. Kashmir willow is denser and harder, so bats are slightly heavier but tougher and far cheaper. For tennis ball cricket, Kashmir willow is the better choice.',
    },
    ...(products.length ? [{
        question: 'How much does a Kashmir willow cricket bat cost?',
        answer: `Wular Sports Kashmir willow bats cost ${priceRange(products)}, covering soft tennis, hard tennis and leather ball models. Every price includes free delivery across India, a bat cover, toe guard and an extra grip.`,
    }] : []),
    {
        question: 'Where are Wular Sports bats made?',
        answer: 'Every Wular Sports bat is handcrafted in Srinagar, Jammu and Kashmir, from Kashmir willow that is naturally seasoned, hard-pressed, fitted with a cane handle, and knocked-in and oiled before dispatch.',
    },
    DELIVERY,
];

export const faqSchema = (faq: Faq[]) => ({
    '@type': 'FAQPage',
    mainEntity: faq.map(f => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
});
