import { blogs } from '../data/blogs';
import { blogsGrowth } from '../data/blogsGrowth';
import { blogsGuides } from '../data/blogsGuides';
import { blogsTrending } from '../data/blogsTrending';
import { blogs2027 } from '../data/blogs2027';
import { isoDateOf } from './blog';
import type { ManagedPost } from './blog';
import RETIRED from '../data/retiredPosts.json';

/**
 * Posts taken off the site. Each address redirects permanently to the post
 * that replaced it (next.config.mjs reads the same file), and the post is
 * hidden everywhere, including copies still sitting in Firestore.
 */
export const RETIRED_POSTS: Record<string, string> = RETIRED;
const live = (p: ManagedPost) => !(p.id in RETIRED_POSTS);

/** Every post that ships with the site's code */
const BUILT_IN_POSTS: ManagedPost[] = [...blogs2027, ...blogsTrending, ...blogsGuides, ...blogsGrowth, ...blogs].filter(live);
const BUILT_IN_BY_ID = new Map(BUILT_IN_POSTS.map(p => [p.id, p]));

/**
 * Server-side blog: posts from Firestore (managed in Admin → Blog), or the
 * built-in posts until the owner starts managing them there. Firebase Admin
 * is imported lazily so pages still build from the built-in posts when
 * Firestore can't be reached at build time.
 */

export interface BlogData {
    posts: ManagedPost[];
    /** true once posts are managed in the admin panel (Firestore) */
    managed: boolean;
    /** Firestore couldn't be reached — these are the built-in posts as a stand-in */
    failed?: boolean;
}

export const BUILT_IN_BLOG: BlogData = { posts: BUILT_IN_POSTS, managed: false };

const plain = ({ updatedAt: _u, createdAt: _c, ...rest }: Record<string, any>) => rest;

/**
 * Posts written into the site's code AFTER the blog moved into the admin panel
 * (new guides added with a site update). They show on the website straight
 * away and are copied into the admin panel on its next change.
 *
 * siteMeta/blog.seededIds lists every built-in post already copied, so a post
 * the owner deleted in the admin panel never comes back. Before that record
 * existed, everything dated before this feature counts as copied.
 */
const MERGE_FROM = '2026-11-10';

async function notYetSeeded(haveIds: Set<string>): Promise<ManagedPost[]> {
    const missing = BUILT_IN_POSTS.filter(p => !haveIds.has(p.id));
    if (!missing.length) return [];
    const { db } = await import('./firebaseAdmin');
    const meta = await db.collection('siteMeta').doc('blog').get();
    const seeded: string[] | null = meta.exists && Array.isArray(meta.get('seededIds')) ? meta.get('seededIds') : null;
    return missing.filter(p => (seeded ? !seeded.includes(p.id) : isoDateOf(p) >= MERGE_FROM));
}

/** For the admin API: built-in posts that still need copying into Firestore */
export async function unseededBuiltIns(): Promise<ManagedPost[]> {
    const { db } = await import('./firebaseAdmin');
    const snap = await db.collection('blogPosts').get();
    return notYetSeeded(new Set(snap.docs.map(d => d.id)));
}

/**
 * A post corrected in the site's code after it was copied into the admin
 * panel: the newest edit wins. Admin saves stamp today's date as modifiedAt,
 * so an edit made in the admin panel after the code change still wins.
 */
function newerFromCode(p: ManagedPost): ManagedPost {
    const code = BUILT_IN_BY_ID.get(p.id);
    if (!code?.modifiedAt || (p.modifiedAt && p.modifiedAt >= code.modifiedAt)) return p;
    return { ...p, ...code, published: p.published, publishedAt: p.publishedAt };
}

export async function getBlog(): Promise<BlogData> {
    try {
        const { db } = await import('./firebaseAdmin');
        const snap = await db.collection('blogPosts').get();
        if (snap.empty) return BUILT_IN_BLOG;
        const posts = snap.docs.map(d => ({ ...plain(d.data()), id: d.id }) as ManagedPost).filter(live).map(newerFromCode);
        const added = await notYetSeeded(new Set(snap.docs.map(d => d.id)));
        return { posts: [...added, ...posts], managed: true };
    } catch (err: any) {
        console.error('Blog: Firestore unavailable, using the built-in posts —', err?.message);
        return { ...BUILT_IN_BLOG, failed: true };
    }
}

/**
 * Blog for a page's getStaticProps. If Firestore is down while a page is
 * being refreshed, throwing keeps the last good page instead of swapping in
 * the built-in posts.
 */
export async function blogForPage(): Promise<BlogData> {
    const blog = await getBlog();
    if (blog.failed && process.env.NEXT_PHASE !== 'phase-production-build') {
        throw new Error('Blog unavailable — keeping the previous version of this page');
    }
    return blog;
}

export const BLOG_REVALIDATE_SECONDS = 600;
