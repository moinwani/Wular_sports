import type { NextApiRequest, NextApiResponse } from 'next';
import { db, FieldValue } from '../../../src/lib/firebaseAdmin';
import { isAdminRequest } from '../../../src/lib/adminAuth';
import { BUILT_IN_CATALOG, getCatalog, invalidateCatalog } from '../../../src/lib/catalogServer';
import { Category, CatalogError, cleanCategory, cleanProduct, productImages, productSizes } from '../../../src/lib/catalog';
import { deleteUnusedPhotos, photosReady } from '../../../src/lib/productPhotos';
import type { ProductFull } from '../../../src/types';

/**
 * Admin-only product & category management (Admin SDK — the `products` and
 * `categories` collections stay closed to browsers; the website reads them
 * on the server). After every change the affected pages are rebuilt so the
 * website shows it within seconds.
 *
 *  GET → { products, categories, managed, photosReady }
 *  POST { action: 'saveProduct' | 'deleteProduct' | 'reorder' | 'saveCategory' | 'deleteCategory', … }
 */

const PRODUCTS = 'products';
const CATEGORIES = 'categories';

const fail = (msg: string): never => { throw new CatalogError(msg); };
const plain = ({ updatedAt: _u, createdAt: _c, ...rest }: Record<string, any>) => rest;

/**
 * The first change copies the built-in catalog into Firestore, so from then
 * on everything is edited in one place.
 */
async function ensureManaged() {
    const any = await db.collection(PRODUCTS).limit(1).get();
    if (!any.empty) return;
    const batch = db.batch();
    BUILT_IN_CATALOG.products.forEach((p, i) => {
        // JSON round-trip drops undefined fields, which Firestore rejects
        batch.set(db.collection(PRODUCTS).doc(p.id), { ...JSON.parse(JSON.stringify(p)), sizes: productSizes(p), order: p.order ?? i + 1, hidden: false, createdAt: FieldValue.serverTimestamp() });
    });
    const cats = await db.collection(CATEGORIES).limit(1).get();
    if (cats.empty) {
        BUILT_IN_CATALOG.categories.forEach(c => batch.set(db.collection(CATEGORIES).doc(c.id), { ...c, createdAt: FieldValue.serverTimestamp() }));
    }
    await batch.commit();
}

async function loadCategories(): Promise<Category[]> {
    const snap = await db.collection(CATEGORIES).get();
    return snap.empty ? BUILT_IN_CATALOG.categories : snap.docs.map(d => ({ ...plain(d.data()), id: d.id }) as Category);
}

/** Rebuild website pages so changes show up straight away. Failures are reported, not fatal. */
async function refreshPages(res: NextApiResponse, paths: string[]): Promise<string[]> {
    invalidateCatalog();
    const failed: string[] = [];
    for (const path of [...new Set(paths)]) {
        try {
            await res.revalidate(path);
        } catch (err: any) {
            console.error('revalidate failed', path, err?.message);
            failed.push(path);
        }
    }
    return failed;
}

const LIST_PAGES = ['/', '/collection', '/review'];
const pathsFor = (categories: Category[], names: string[]) =>
    categories.filter(c => names.includes(c.name)).map(c => c.path);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!(await isAdminRequest(req))) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    try {
        if (req.method === 'GET') {
            const catalog = await getCatalog({ fresh: true });
            if (catalog.failed) return res.status(503).json({ error: 'Could not load products from the database. Try again in a minute.' });
            return res.status(200).json({
                products: [...catalog.products].sort((a, b) => (a.order ?? 999) - (b.order ?? 999)),
                categories: catalog.categories,
                managed: catalog.managed,
                photosReady: photosReady(),
            });
        }
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

        const b = req.body || {};
        await ensureManaged();

        switch (b.action) {
            case 'saveProduct': {
                const categories = await loadCategories();
                const isNew = b.isNew === true;
                const product = cleanProduct(b.product, categories.map(c => c.name), isNew);
                const ref = db.collection(PRODUCTS).doc(product.id);
                const prevSnap = await ref.get();
                if (isNew && prevSnap.exists) fail(`A product with the web address “${product.id}” already exists — change the name or address`);
                if (!isNew && !prevSnap.exists) fail('This product no longer exists');
                const prev = prevSnap.exists ? (prevSnap.data() as ProductFull) : null;

                // Ratings come from reviews, never from the form
                if (prev?.aggregateRating) product.aggregateRating = prev.aggregateRating;
                else delete product.aggregateRating;
                if (isNew && (b.product?.order == null)) {
                    const all = await db.collection(PRODUCTS).get();
                    product.order = all.docs.reduce((m, d) => Math.max(m, d.get('order') || 0), 0) + 1;
                }

                await ref.set({
                    ...product,
                    updatedAt: FieldValue.serverTimestamp(),
                    ...(prev ? {} : { createdAt: FieldValue.serverTimestamp() }),
                });

                // Photos taken off this product are deleted from storage (if nothing else uses them)
                const removed = prev ? productImages(prev).filter(u => !productImages(product).includes(u)) : [];
                await deleteUnusedPhotos(removed);

                const failed = await refreshPages(res, [
                    ...LIST_PAGES,
                    `/product/${product.id}`,
                    ...pathsFor(categories, [...product.category, ...(prev?.category || [])]),
                ]);
                return res.status(200).json({ product, refreshFailed: failed });
            }

            case 'deleteProduct': {
                const id = String(b.id || '');
                const ref = db.collection(PRODUCTS).doc(id || fail('Missing product'));
                const snap = await ref.get();
                if (!snap.exists) fail('This product no longer exists');
                const prev = snap.data() as ProductFull;
                await ref.delete();
                await deleteUnusedPhotos(productImages(prev));
                const categories = await loadCategories();
                const failed = await refreshPages(res, [...LIST_PAGES, `/product/${id}`, ...pathsFor(categories, prev.category || [])]);
                return res.status(200).json({ ok: true, refreshFailed: failed });
            }

            case 'reorder': {
                const ids: string[] = Array.isArray(b.ids) ? b.ids.filter((x: unknown) => typeof x === 'string').slice(0, 500) : [];
                const batch = db.batch();
                ids.forEach((id, i) => batch.update(db.collection(PRODUCTS).doc(id), { order: i + 1 }));
                await batch.commit();
                const categories = await loadCategories();
                const failed = await refreshPages(res, [...LIST_PAGES, ...categories.map(c => c.path)]);
                return res.status(200).json({ ok: true, refreshFailed: failed });
            }

            case 'saveCategory': {
                const isNew = b.isNew === true;
                const categories = await loadCategories();
                const prev = isNew ? undefined : categories.find(c => c.id === b.category?.id);
                if (!isNew && !prev) fail('This category no longer exists');
                // The original three keep their web addresses
                const category = cleanCategory({ ...b.category, builtIn: prev?.builtIn, path: prev?.path }, isNew);
                if (isNew && categories.some(c => c.id === category.id)) fail(`A category with the address “${category.id}” already exists`);
                if (categories.some(c => c.name.toLowerCase() === category.name.toLowerCase() && c.id !== category.id)) {
                    fail(`Another category is already called “${category.name}”`);
                }
                if (isNew && b.category?.order == null) category.order = categories.reduce((m, c) => Math.max(m, c.order), 0) + 1;

                const batch = db.batch();
                batch.set(db.collection(CATEGORIES).doc(category.id), { ...category, updatedAt: FieldValue.serverTimestamp() });
                // Renamed → move its products to the new name
                if (prev && prev.name !== category.name) {
                    const tagged = await db.collection(PRODUCTS).where('category', 'array-contains', prev.name).get();
                    tagged.docs.forEach(d => batch.update(d.ref, {
                        category: (d.get('category') as string[]).map(n => (n === prev.name ? category.name : n)),
                    }));
                }
                await batch.commit();
                const failed = await refreshPages(res, [...LIST_PAGES, category.path]);
                return res.status(200).json({ category, refreshFailed: failed });
            }

            case 'deleteCategory': {
                const categories = await loadCategories();
                const cat = categories.find(c => c.id === b.id) || fail('This category no longer exists');
                if (cat.builtIn) fail('The original categories can’t be deleted — untick “Show in menu” to hide it instead');
                const used = await db.collection(PRODUCTS).where('category', 'array-contains', cat.name).limit(1).get();
                if (!used.empty) fail('Move or delete the products in this category first');
                await db.collection(CATEGORIES).doc(cat.id).delete();
                const failed = await refreshPages(res, [...LIST_PAGES, cat.path]);
                return res.status(200).json({ ok: true, refreshFailed: failed });
            }

            default:
                return res.status(400).json({ error: 'Unknown action' });
        }
    } catch (err: any) {
        if (err instanceof CatalogError) return res.status(400).json({ error: err.message });
        console.error('admin/products failed:', err?.message);
        return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
}
