import { useRouter } from 'next/router';
import { useCart } from '../src/context/CartContext';
import { useToast } from '../src/context/ToastContext';
import { HomeView } from '../src/views/HomeView';
import { GetStaticProps } from 'next';
import { ProductFull } from '../src/types';
import { catalogPageProps, PAGE_REVALIDATE_SECONDS } from '../src/lib/catalogServer';

export default function HomePage() {
    const router = useRouter();
    const { addToCart } = useCart();
    const { showToast } = useToast();

    const handleAddToCart = (product: ProductFull, size: string | null, quantity?: number) => {
        addToCart(product, size, quantity);
        showToast(`${product.name} added to cart!`);
    };

    return (
        <HomeView
            onShopCollectionClick={() => router.push('/collection')}
            onAddToCart={handleAddToCart}
            onImageClick={() => {}}
            onWatchVideo={() => {}}
        />
    );
}

export const getStaticProps: GetStaticProps = async () => ({
    props: await catalogPageProps(),
    revalidate: PAGE_REVALIDATE_SECONDS,
});
