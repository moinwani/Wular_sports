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
            bodyText="Soft tennis cricket, also known as tape ball cricket, requires bats that are lightweight yet explosive — and that's exactly what our Kashmiri willow soft tennis bats deliver. Unlike heavier hard tennis bats, soft tennis bats are designed with a thinner profile and a lighter pickup weight, allowing for faster bat speeds and quicker reaction times against the swinging tape ball. Our signature honeycomb scoop design removes excess wood from the back of the blade, reducing overall weight while maintaining a massive sweet spot for power hitting. Every bat is handcrafted in our Srinagar workshop from carefully selected Kashmiri willow clefts, oiled, pressed, and knocked-in over several days to ensure peak performance from the very first ball. The result is a bat that feels effortless in your hands yet generates explosive power — perfect for tape ball tournaments, gully cricket, and casual matches. Each bat includes a free bat cover, toe guard, and grip, with free shipping anywhere in India."
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
