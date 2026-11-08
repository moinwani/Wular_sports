import type { BlogPost } from '../types';

/**
 * Blog post shapes and rules shared by the website, the admin panel and the
 * API routes. Pure code (types only) so it runs anywhere.
 *
 * Posts live in Firestore once the owner starts managing them from
 * Admin → Blog; until then the built-in posts in src/data/blogs.ts are used.
 */

export interface ManagedPost extends BlogPost {
    /** Drafts stay in the admin panel and are not on the website */
    published?: boolean;
    /** YYYY-MM-DD — drives the order on the blog page (newest first) */
    publishedAt?: string;
    /** YYYY-MM-DD of the last edit — tells Google the article is kept up to date */
    modifiedAt?: string;
    /** Optional shorter title for Google (the page heading stays the full title) */
    seoTitle?: string;
}

/** A post without its body — what the blog list page needs */
export type PostSummary = Omit<ManagedPost, 'content' | 'faq'>;

export const DEFAULT_AUTHOR = 'Wular Sports Team';

export const slugify = (s: string) =>
    String(s || '').toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim()
        .replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 90);

/** "Jan 30, 2026" style, as shown on the blog */
export const displayDate = (iso: string) => {
    const d = new Date(`${iso}T12:00:00`);
    return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/** Best-effort YYYY-MM-DD from a post (built-in posts only have the display date) */
export const isoDateOf = (p: Pick<ManagedPost, 'publishedAt' | 'date'>): string => {
    if (p.publishedAt && /^\d{4}-\d{2}-\d{2}$/.test(p.publishedAt)) return p.publishedAt;
    const d = new Date(p.date);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const textOf = (html: string) => String(html || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();

/** "8 min read" from the body (about 220 words a minute) */
export const readTimeFor = (html: string) => `${Math.max(1, Math.round(textOf(html).split(' ').filter(Boolean).length / 220))} min read`;

export const isLive = (p: ManagedPost) => p.published !== false;

export const SITE_URL = 'https://wularsports.com';
/** Full https link for an image or page path (Google and link previews need absolute URLs) */
export const absoluteUrl = (src: string) => (/^https?:\/\//.test(src) ? src : `${SITE_URL}${src.startsWith('/') ? '' : '/'}${src}`);

/** The <title> Google shows: the SEO title if set, else the post title */
export const pageTitleFor = (p: Pick<ManagedPost, 'title' | 'seoTitle'>) => `${p.seoTitle || p.title} | Wular Sports`;

export interface SeoCheck { ok: boolean; label: string; tip: string; }

/** A quick on-page SEO checklist for the editor */
export const seoChecks = (p: Pick<ManagedPost, 'title' | 'seoTitle' | 'description' | 'content' | 'image' | 'faq' | 'id'>): SeoCheck[] => {
    const html = String(p.content || '');
    const words = textOf(html).split(' ').filter(Boolean).length;
    const titleLen = pageTitleFor(p).length;
    const h2 = (html.match(/<h2[\s>]/gi) || []).length;
    const imgs = html.match(/<img\b[^>]*>/gi) || [];
    const noAlt = imgs.filter(t => !/\balt="[^"]+"/i.test(t)).length;
    return [
        { ok: titleLen >= 30 && titleLen <= 65, label: `Google title is ${titleLen} characters`, tip: 'Aim for 30–65 so it isn’t cut off. Use “SEO title” for a shorter version.' },
        { ok: p.description.length >= 110 && p.description.length <= 160, label: `Summary is ${p.description.length} characters`, tip: 'Aim for 110–160 — this is the grey text under your link on Google.' },
        { ok: words >= 800, label: `${words} words`, tip: 'Guides that rank usually have 800+ words that fully answer the question.' },
        { ok: h2 >= 2, label: `${h2} section heading${h2 === 1 ? '' : 's'}`, tip: 'Use “Heading” (H2) for each main section — at least 2. Put the main search words in them.' },
        { ok: /href="\/product\//.test(html), label: 'Links to one of your bats', tip: 'Use the “Bat” button to link a relevant bat — it helps that product rank and sell.' },
        { ok: !!p.image, label: 'Has a cover photo', tip: 'Posts with a cover photo get more clicks from Google and WhatsApp shares.' },
        { ok: noAlt === 0, label: noAlt ? `${noAlt} photo${noAlt === 1 ? '' : 's'} without a description` : 'Photos have descriptions', tip: 'Describe each photo in a few words (alt text) — Google Images reads it.' },
        { ok: (p.faq || []).length >= 2, label: `${(p.faq || []).length} FAQ question${(p.faq || []).length === 1 ? '' : 's'}`, tip: 'Add 2–5 real questions buyers ask — they can show directly in Google results.' },
        { ok: !!p.id && p.id.length <= 70, label: 'Short web address', tip: 'Keep the address short and made of the main search words.' },
    ];
};

/** Published posts, newest first */
export const livePosts = (posts: ManagedPost[]) =>
    posts.filter(isLive).sort((a, b) => isoDateOf(b).localeCompare(isoDateOf(a)));

export const toSummary = ({ content: _c, faq: _f, ...rest }: ManagedPost): PostSummary => rest;

/** Up to `n` other posts to suggest under an article — same category first, then newest */
export const relatedTo = (post: ManagedPost, posts: ManagedPost[], n = 2) => {
    const others = livePosts(posts).filter(p => p.id !== post.id);
    return [...others.filter(p => p.category === post.category), ...others.filter(p => p.category !== post.category)].slice(0, n);
};

/* ───────────── Validation (the API stores only clean data) ───────────── */

export class BlogError extends Error {}
const fail = (msg: string): never => { throw new BlogError(msg); };
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const isImage = (v: unknown): v is string =>
    typeof v === 'string' && v.length <= 600 && (/^https:\/\/[^\s"'<>]+$/.test(v) || /^\/api\/photo\/[\w./%-]+$/.test(v));

/**
 * Clean a post from the admin form. `sanitize` removes anything unsafe from
 * the article HTML (scripts, event handlers…) — passed in so this file stays
 * free of heavy imports.
 */
export function cleanPost(raw: any, isNew: boolean, sanitize: (html: string) => string): ManagedPost {
    const title = str(raw?.title, 200) || fail('Give the post a title');
    const id = isNew ? (slugify(raw?.id || title) || fail('Could not make a web address from the title')) : str(raw?.id, 120);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) fail('Web address can only use small letters, numbers and dashes');
    const content = sanitize(String(raw?.content || '')).slice(0, 200_000);
    if (textOf(content).length < 50) fail('Write the article (at least a few sentences)');
    const image = isImage(raw?.image) ? raw.image : fail('Add a cover photo');
    const publishedAt = /^\d{4}-\d{2}-\d{2}$/.test(raw?.publishedAt || '') ? raw.publishedAt : fail('Pick a date');
    const faq = (Array.isArray(raw?.faq) ? raw.faq : [])
        .map((f: any) => ({ question: str(f?.question, 300), answer: str(f?.answer, 2000) }))
        .filter((f: { question: string; answer: string }) => f.question && f.answer)
        .slice(0, 20);

    const seoTitle = str(raw?.seoTitle, 70);
    const post: ManagedPost = {
        id,
        title,
        description: str(raw?.description, 320) || fail('Add a short summary (it shows on Google and on the blog page)'),
        content,
        author: str(raw?.author, 80) || DEFAULT_AUTHOR,
        category: str(raw?.category, 40) || 'Guides',
        image,
        publishedAt,
        date: displayDate(publishedAt),
        readTime: readTimeFor(content),
        published: raw?.published !== false,
    };
    if (faq.length) post.faq = faq;
    if (seoTitle) post.seoTitle = seoTitle;
    return post;
}
