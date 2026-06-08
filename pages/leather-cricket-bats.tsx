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
            bodyText="For cricketers who play with a leather ball — whether in club matches, district tournaments, or professional leagues — a high-quality leather cricket bat is essential. Our leather ball bats are crafted from the finest Grade A+ Kashmiri willow, selected for its straight grains, clean appearance, and excellent performance characteristics. Each cleft is seasoned for over 12 months before being shaped by hand in our Srinagar workshop, where master craftsmen apply decades of expertise to create bats with the perfect balance of weight distribution, edge profile, and spine height. The dense Kashmiri willow used in our leather bats offers exceptional durability and a responsive middle that generates impressive ping and shot power against the hard leather ball. Equipped with a premium Singapore cane handle for superior vibration dampening and a comfortable double-grip setup, these bats are tournament-ready right out of the box. Every leather bat includes complimentary knocking-in and oiling, plus a free bat cover, toe guard, and extra grip with free delivery across India."
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
