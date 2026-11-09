import { createContext, FC, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { products as BUILT_IN_PRODUCTS } from '../data/products';
import { Category, DEFAULT_CATEGORIES, PublicCatalog, visibleProducts } from '../lib/catalog';

/**
 * The live product catalog for the website: visible products + categories.
 * Pages that build their HTML on the server pass it in (pageProps.catalog),
 * so it's correct from the first paint; other pages fetch /api/catalog.
 * The built-in list is only the starting value.
 */

const BUILT_IN: PublicCatalog = { products: visibleProducts(BUILT_IN_PRODUCTS), categories: DEFAULT_CATEGORIES };

/** loaded: real catalog data (from the page or the API), not the built-in starting list.
 *  live: the products are a just-fetched copy of the database (see refresh). */
type CatalogValue = PublicCatalog & { refresh: () => void; loaded: boolean; live: boolean };

const Ctx = createContext<CatalogValue>({ ...BUILT_IN, refresh: () => {}, loaded: false, live: false });

export const CatalogProvider: FC<{ initial?: PublicCatalog | null; children: ReactNode }> = ({ initial, children }) => {
    // Last catalog seen (from a page or the API) — kept while moving between pages
    const [latest, setLatest] = useState<PublicCatalog | null>(initial || null);

    useEffect(() => {
        if (initial) setLatest(initial);
    }, [initial]);

    useEffect(() => {
        if (latest) return;
        let cancelled = false;
        fetch('/api/catalog')
            .then(r => (r.ok ? r.json() : null))
            .then(data => {
                if (!cancelled && data?.products) setLatest({ products: data.products, categories: data.categories });
            })
            .catch(() => { /* keep the built-in list */ });
        return () => { cancelled = true; };
    }, [latest]);

    // Newest catalog fetched on request (e.g. at checkout); a new page's own data takes over again
    const [fresh, setFresh] = useState<(PublicCatalog & { live?: boolean }) | null>(null);
    useEffect(() => { if (initial) setFresh(null); }, [initial]);

    /** Fetch the newest catalog now (bypassing the short CDN cache) — e.g. when checkout opens */
    const refresh = useCallback(() => {
        fetch(`/api/catalog?fresh=${Date.now()}`)
            .then(r => (r.ok ? r.json() : null))
            .then(data => { if (data?.products) setFresh({ products: data.products, categories: data.categories, live: data.live === true }); })
            .catch(() => { /* keep what we have */ });
    }, []);

    const value = useMemo<CatalogValue>(() => {
        const current = fresh || initial || latest || BUILT_IN;
        return { products: current.products, categories: current.categories, refresh, loaded: current !== BUILT_IN, live: !!fresh?.live };
    }, [fresh, initial, latest, refresh]);
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useCatalog = () => useContext(Ctx);

/** Website address of the category a product belongs to */
export const categoryPathFor = (categories: Category[], categoryName?: string) =>
    categories.find(c => c.name === categoryName)?.path || '/collection';
