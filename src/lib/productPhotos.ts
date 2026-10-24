import { del, put } from '@vercel/blob';
import { db } from './firebaseAdmin';
import { productImages } from './catalog';

/**
 * Product photo storage (Vercel Blob). Photos uploaded from the admin panel
 * get a permanent public address on *.public.blob.vercel-storage.com.
 * The original photos in the GitHub repo are never touched.
 */

export const photosReady = () => !!process.env.BLOB_READ_WRITE_TOKEN;

const isOurPhoto = (url: string) => {
    try { return new URL(url).hostname.endsWith('.public.blob.vercel-storage.com'); } catch { return false; }
};

export async function savePhoto(folder: string, filename: string, body: Buffer, contentType: string): Promise<string> {
    const safeFolder = folder.replace(/[^a-z0-9.-]/gi, '').slice(0, 60) || 'misc';
    const safeName = filename.toLowerCase().replace(/[^a-z0-9.-]/g, '-').replace(/-+/g, '-').slice(-60) || 'photo.jpg';
    const blob = await put(`products/${safeFolder}/${safeName}`, body, {
        access: 'public',
        contentType,
        addRandomSuffix: true,
        token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
}

/** Delete uploaded photos that no product uses any more. Best-effort. */
export async function deleteUnusedPhotos(urls: string[]): Promise<void> {
    const candidates = urls.filter(isOurPhoto);
    if (!candidates.length || !photosReady()) return;
    try {
        const all = await db.collection('products').get();
        const inUse = new Set(all.docs.flatMap(d => productImages(d.data() as any)));
        const unused = candidates.filter(u => !inUse.has(u));
        if (unused.length) await del(unused, { token: process.env.BLOB_READ_WRITE_TOKEN });
    } catch (err: any) {
        console.error('photo cleanup failed:', err?.message);
    }
}
