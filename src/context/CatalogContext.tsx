import { createContext, FC, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { products as BUILT_IN_PRODUCTS } from '../data/products';
import { Category, DEFAULT_CATEGORIES, PublicCatalog, visibleProducts } from '../lib/catalog';

/**
 * The live product catalog for the website: visible products + categories.
 * Pages that build their HTML on the server pass it in (pageProps.catalog),
 * so it's correct from the first paint; other pages fetch /api/catalog.
 * The built-in list is only the starting value.
 */

const BUILT_IN: PublicCatalog = { products: visibleProducts(BUILT_IN_PRODUCTS), categories: DEFAULT_CATEGORIES };

const Ctx = createContext<PublicCatalog>(BUILT_IN);

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

    const value = useMemo(() => initial || latest || BUILT_IN, [initial, latest]);
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useCatalog = () => useContext(Ctx);

/** Website address of the category a product belongs to */
export const categoryPathFor = (categories: Category[], categoryName?: string) =>
    categories.find(c => c.name === categoryName)?.path || '/collection';
