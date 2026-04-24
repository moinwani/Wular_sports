import { GetStaticProps } from 'next';
import { CategoryView } from '../src/views/CategoryView';
import { products } from '../src/data/products';
import { ProductFull } from '../src/types';
import { useCart } from '../src/context/CartContext';
import { useToast } from '../src/context/ToastContext';

interface Props { products: ProductFull[]; }

export default function HardTennisBatsPage({ products }: Props) {
    const { addToCart } = useCart();
    const { showToast } = useToast();
    return (
        <CategoryView
            title="Hard Tennis Bats"
            h1Title="Hard Tennis Cricket Bats by Wular Sports"
            description="Discover premium handcrafted hard tennis cricket bats made from Kashmiri willow. Optimized for power play and tournament performance."
            keywords="hard tennis bat, hard tennis cricket bat, kashmiri willow hard tennis bat, scoop bat hard tennis"
            canonicalUrl="https://wularsports.com/hard-tennis-bats"
            products={products}
            onAddToCart={(p, s) => { addToCart(p, s); showToast(`${p.name} added to cart!`); }}
            onImageClick={() => {}}
            onWatchVideo={() => {}}
        />
    );
}

export const getStaticProps: GetStaticProps = async () => ({
    props: { products: products.filter(p => p.category.some(c => c.toLowerCase().includes("hard"))) }
});
