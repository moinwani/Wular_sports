import { GetStaticProps } from 'next';
import { CategoryView } from '../src/views/CategoryView';
import { products } from '../src/data/products';
import { ProductFull } from '../src/types';
import { useCart } from '../src/context/CartContext';
import { useToast } from '../src/context/ToastContext';

interface Props { products: ProductFull[]; }

export default function SoftTennisBatsPage({ products }: Props) {
    const { addToCart } = useCart();
    const { showToast } = useToast();
    return (
        <CategoryView
            title="Soft Tennis Bats"
            h1Title="Soft Tennis Cricket Bats by Wular Sports"
            description="Lightweight and powerful soft tennis bats for explosive hitting and control. Handcrafted Kashmiri willow with honeycomb scoop design."
            keywords="soft tennis bat, soft tennis cricket bat, honeycomb scoop bat, tape ball bat, kashmiri willow soft tennis"
            canonicalUrl="https://wularsports.com/soft-tennis-bats"
            products={products}
            onAddToCart={(p, s) => { addToCart(p, s); showToast(`${p.name} added to cart!`); }}
            onImageClick={() => {}}
            onWatchVideo={() => {}}
        />
    );
}

export const getStaticProps: GetStaticProps = async () => ({
    props: { products: products.filter(p => p.category.some(c => c.toLowerCase().includes("soft"))) }
});
