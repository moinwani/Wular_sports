import { FC } from 'react';
import { CategoryView } from './CategoryView';
import { useCatalog } from '../context/CatalogContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { visibleProducts } from '../lib/catalog';
import { Guide, TENNIS_HUB } from '../lib/seoContent';

const TENNIS_CATEGORY_IDS = ['hard-tennis', 'soft-tennis'];

/**
 * All tennis-ball bats together. People search "tennis cricket bat" and
 * "tennis ball cricket bat" far more than they search by hard or soft, and
 * this page answers that search; it links on to the two categories.
 */
export const TennisBatsPage: FC<{ guides?: Guide[] }> = ({ guides }) => {
    const { products, categories } = useCatalog();
    const { addToCart } = useCart();
    const { showToast } = useToast();
    const tennis = categories.filter(c => TENNIS_CATEGORY_IDS.includes(c.id));
    const names = tennis.map(c => c.name);
    const bats = visibleProducts(products).filter(p => p.category.some(c => names.includes(c)));

    return (
        <CategoryView
            title={TENNIS_HUB.title}
            seoTitle={TENNIS_HUB.seoTitle}
            h1Title={TENNIS_HUB.h1}
            description={TENNIS_HUB.description}
            keywords={TENNIS_HUB.keywords}
            bodyText={TENNIS_HUB.bodyText}
            canonicalUrl={`https://wularsports.com${TENNIS_HUB.path}`}
            products={bats}
            faq={TENNIS_HUB.faq(bats)}
            faqHeading={TENNIS_HUB.faqHeading}
            guides={guides}
            links={tennis.map(c => ({ href: c.path, label: `${c.title} only` }))}
            showCategory
            onAddToCart={(p, s) => { addToCart(p, s); showToast(`${p.name} added to cart!`); }}
            onImageClick={() => {}}
            onWatchVideo={() => {}}
        />
    );
};
