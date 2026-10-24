import { FC } from 'react';
import { CategoryView } from './CategoryView';
import { useCatalog } from '../context/CatalogContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { productsIn } from '../lib/catalog';

/** A category page (built-in or created in Admin → Products), filled from the live catalog. */
export const CategoryPage: FC<{ categoryId: string }> = ({ categoryId }) => {
    const { products, categories } = useCatalog();
    const { addToCart } = useCart();
    const { showToast } = useToast();
    const category = categories.find(c => c.id === categoryId);
    if (!category) return <div className="container" style={{ padding: '6rem 1rem' }}>This category isn’t available.</div>;

    return (
        <CategoryView
            title={category.title}
            h1Title={category.h1}
            description={category.description}
            keywords={category.keywords || ''}
            bodyText={category.bodyText || ''}
            canonicalUrl={`https://wularsports.com${category.path}`}
            products={productsIn(products, category)}
            onAddToCart={(p, s) => { addToCart(p, s); showToast(`${p.name} added to cart!`); }}
            onImageClick={() => {}}
            onWatchVideo={() => {}}
        />
    );
};
