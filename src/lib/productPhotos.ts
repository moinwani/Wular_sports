import { del, put } from '@vercel/blob';
import { db } from './firebaseAdmin';
import { productImages } from './catalog';

/**
 * Product photo storage (Vercel Blob). Signs in with the project's
 * BLOB_STORE_ID + Vercel's built-in identity token (or a legacy
 * BLOB_READ_WRITE_TOKEN). A public store serves photos from
 * *.public.blob.vercel-storage.com; a private store is served through our
 * own /api/photo/… route. The original photos in the GitHub repo are never
 * touched.
 */

export const PHOTO_ROUTE = '/api/photo/';

export const photosReady = () => !!(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);

/** Blob pathname for a photo we stored, or null for photos from elsewhere */
const blobTarget = (url: string): string | null => {
    if (url.startsWith(PHOTO_ROUTE)) return decodeURIComponent(url.slice(PHOTO_ROUTE.length));
    try {
        return new URL(url).hostname.endsWith('.blob.vercel-storage.com') ? url : null;
    } catch {
        return null;
    }
};

export async function savePhoto(folder: string, filename: string, body: Buffer, contentType: string): Promise<string> {
    const safeFolder = folder.replace(/[^a-z0-9.-]/gi, '').slice(0, 60) || 'misc';
    const safeName = filename.toLowerCase().replace(/[^a-z0-9.-]/g, '-').replace(/-+/g, '-').slice(-60) || 'photo.jpg';
    const pathname = `products/${safeFolder}/${safeName}`;
    const options = { contentType, addRandomSuffix: true, cacheControlMaxAge: 31536000 };
    try {
        return (await put(pathname, body, { ...options, access: 'public' })).url;
    } catch (publicErr: any) {
        // Private stores refuse public uploads — store privately and serve through our route
        try {
            const blob = await put(pathname, body, { ...options, access: 'private' });
            return PHOTO_ROUTE + blob.pathname.split('/').map(encodeURIComponent).join('/');
        } catch {
            throw publicErr;
        }
    }
}

/** Delete uploaded photos that no product uses any more. Best-effort. */
export async function deleteUnusedPhotos(urls: string[]): Promise<void> {
    const candidates = urls.filter(u => blobTarget(u));
    if (!candidates.length || !photosReady()) return;
    try {
        const all = await db.collection('products').get();
        const inUse = new Set(all.docs.flatMap(d => productImages(d.data() as any)));
        const unused = candidates.filter(u => !inUse.has(u)).map(u => blobTarget(u)!);
        if (unused.length) await del(unused);
    } catch (err: any) {
        console.error('photo cleanup failed:', err?.message);
    }
}
