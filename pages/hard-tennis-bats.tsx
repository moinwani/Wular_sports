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
            bodyText="Hard tennis cricket is one of the most popular formats of the game across India, played with a heavy tennis ball that demands both power and precision from your bat. Our handcrafted Kashmiri willow hard tennis bats are specifically engineered for this format — each bat is shaped, balanced, and finished by master craftsmen in Srinagar, Kashmir using traditional techniques passed down through generations. Whether you play weekend tournaments or competitive leagues, the dense grain structure of Kashmiri willow gives you the durability and raw power you need to clear boundaries effortlessly. Our hard tennis bats feature premium Singapore cane handles for superior shock absorption and a comfortable grip that lets you play long innings without fatigue. Available in both scoop and non-scoop profiles, every bat comes fully knocked-in and match-ready with a bat cover, toe guard, and extra grip — so you can step onto the field the moment your order arrives."
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
