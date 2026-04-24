import { useRouter } from 'next/router';
import { useCart } from '../src/context/CartContext';
import { useToast } from '../src/context/ToastContext';
import { HomeView } from '../src/views/HomeView';
import { products } from '../src/data/products';
import { ProductFull } from '../src/types';

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
