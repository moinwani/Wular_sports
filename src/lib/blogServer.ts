import { blogs as BUILT_IN_POSTS } from '../data/blogs';
import type { ManagedPost } from './blog';

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

export async function getBlog(): Promise<BlogData> {
    try {
        const { db } = await import('./firebaseAdmin');
        const snap = await db.collection('blogPosts').get();
        if (snap.empty) return BUILT_IN_BLOG;
        return { posts: snap.docs.map(d => ({ ...plain(d.data()), id: d.id }) as ManagedPost), managed: true };
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
