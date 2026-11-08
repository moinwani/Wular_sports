import type { NextApiRequest, NextApiResponse } from 'next';
import { cleanArticleHtml } from '../../../src/lib/articleHtml';
import { db, FieldValue } from '../../../src/lib/firebaseAdmin';
import { isAdminRequest } from '../../../src/lib/adminAuth';
import { BUILT_IN_BLOG, getBlog } from '../../../src/lib/blogServer';
import { BlogError, ManagedPost, cleanPost, isoDateOf } from '../../../src/lib/blog';
import { deleteUnusedPhotos } from '../../../src/lib/productPhotos';

/**
 * Admin-only blog management (Admin SDK — the `blogPosts` collection stays
 * closed to browsers; the website reads it on the server). Every save
 * rebuilds the blog page and the post, so changes are live within seconds.
 *
 *  GET → { posts, managed }
 *  POST { action: 'savePost' | 'deletePost', … }
 */

export const config = { api: { bodyParser: { sizeLimit: '1mb' } } };

const POSTS = 'blogPosts';
const fail = (msg: string): never => { throw new BlogError(msg); };

/** Article HTML without scripts, event handlers or other unsafe markup */
const sanitize = cleanArticleHtml;

/** The first change copies the built-in posts into Firestore, so everything is edited in one place. */
async function ensureManaged() {
    const any = await db.collection(POSTS).limit(1).get();
    if (!any.empty) return;
    const batch = db.batch();
    BUILT_IN_BLOG.posts.forEach(p => {
        batch.set(db.collection(POSTS).doc(p.id), {
            ...JSON.parse(JSON.stringify(p)),
            publishedAt: isoDateOf(p),
            published: true,
            createdAt: FieldValue.serverTimestamp(),
        });
    });
    await batch.commit();
}

/** Live post pages — their "Continue reading" links point at other posts */
async function allPostPages(): Promise<string[]> {
    const snap = await db.collection(POSTS).get();
    return snap.docs.filter(d => d.get('published') !== false).map(d => `/blog/${d.id}`);
}

async function refreshPages(res: NextApiResponse, paths: string[]): Promise<string[]> {
    const list = [...new Set(paths)];
    const results = await Promise.allSettled(list.map(p => res.revalidate(p)));
    return list.filter((p, i) => {
        const r = results[i];
        if (r.status === 'rejected') console.error('revalidate failed', p, (r.reason as any)?.message);
        return r.status === 'rejected';
    });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!(await isAdminRequest(req))) return res.status(403).json({ error: 'Admin access required' });

    try {
        if (req.method === 'GET') {
            const blog = await getBlog();
            if (blog.failed) return res.status(503).json({ error: 'Could not load posts from the database. Try again in a minute.' });
            const posts = [...blog.posts]
                .map(p => ({ ...p, publishedAt: isoDateOf(p), published: p.published !== false }))
                .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
            return res.status(200).json({ posts, managed: blog.managed });
        }
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

        const b = req.body || {};
        await ensureManaged();

        switch (b.action) {
            case 'savePost': {
                const isNew = b.isNew === true;
                const post = cleanPost(b.post, isNew, sanitize);
                const ref = db.collection(POSTS).doc(post.id);
                const prevSnap = await ref.get();
                if (isNew && prevSnap.exists) fail(`A post with the web address “${post.id}” already exists — change the title or address`);
                if (!isNew && !prevSnap.exists) fail('This post no longer exists');
                const prev = prevSnap.exists ? (prevSnap.data() as ManagedPost) : null;

                // Last-edited date, shown to Google as dateModified
                post.modifiedAt = new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10);
                await ref.set({
                    ...post,
                    updatedAt: FieldValue.serverTimestamp(),
                    ...(prev ? {} : { createdAt: FieldValue.serverTimestamp() }),
                });
                // A replaced cover photo is deleted from storage if nothing else uses it
                if (prev?.image && prev.image !== post.image) await deleteUnusedPhotos([prev.image]);

                // Unpublishing or renaming changes the "Continue reading" links on other posts too
                const wentOffline = prev?.published !== false && !post.published;
                const titleChanged = prev && (prev.title !== post.title || prev.image !== post.image);
                const refreshFailed = await refreshPages(res, ['/blog', `/blog/${post.id}`, ...(wentOffline || titleChanged ? await allPostPages() : [])]);
                return res.status(200).json({ post, refreshFailed });
            }

            case 'deletePost': {
                const id = String(b.id || '');
                const ref = db.collection(POSTS).doc(id || fail('Missing post'));
                const snap = await ref.get();
                if (!snap.exists) fail('This post no longer exists');
                const prev = snap.data() as ManagedPost;
                await ref.delete();
                if (prev.image) await deleteUnusedPhotos([prev.image]);
                const refreshFailed = await refreshPages(res, ['/blog', `/blog/${id}`, ...(await allPostPages())]);
                return res.status(200).json({ ok: true, refreshFailed });
            }

            default:
                return res.status(400).json({ error: 'Unknown action' });
        }
    } catch (err: any) {
        if (err instanceof BlogError) return res.status(400).json({ error: err.message });
        console.error('admin/blog failed:', err?.message);
        return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
}
