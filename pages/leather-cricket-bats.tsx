import { GetStaticProps } from 'next';
import { CategoryView } from '../src/views/CategoryView';
import { products } from '../src/data/products';
import { ProductFull } from '../src/types';
import { useCart } from '../src/context/CartContext';
import { useToast } from '../src/context/ToastContext';

interface Props { products: ProductFull[]; }

export default function LeatherCricketBatsPage({ products }: Props) {
    const { addToCart } = useCart();
    const { showToast } = useToast();
    return (
        <CategoryView
            title="Leather Cricket Bats"
            h1Title="Leather Cricket Bats by Wular Sports"
            description="Professional leather ball cricket bats handcrafted from the finest Grade A+ Kashmir willow. Built for serious cricket."
            keywords="leather cricket bat, leather ball bat, professional cricket bat, kashmiri willow leather bat, Grade A willow bat"
            canonicalUrl="https://wularsports.com/leather-cricket-bats"
            products={products}
            onAddToCart={(p, s) => { addToCart(p, s); showToast(`${p.name} added to cart!`); }}
            onImageClick={() => {}}
            onWatchVideo={() => {}}
        />
    );
}

export const getStaticProps: GetStaticProps = async () => ({
    props: { products: products.filter(p => p.category.some(c => c.toLowerCase().includes("leather"))) }
});
