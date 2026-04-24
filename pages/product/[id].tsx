import { GetStaticPaths, GetStaticProps } from 'next';
import { ProductDetailsView } from '../../src/views/ProductDetailsView';
import { products } from '../../src/data/products';
import { ProductFull } from '../../src/types';
import { useCart } from '../../src/context/CartContext';
import { useToast } from '../../src/context/ToastContext';

interface Props { product: ProductFull; }

export default function ProductPage({ product }: Props) {
    const { addToCart } = useCart();
    const { showToast } = useToast();

    return (
        <ProductDetailsView
            product={product}
            onAddToCart={(p, s, q) => {
                addToCart(p, s, q);
                showToast(`${p.name} added to cart!`);
            }}
        />
    );
}

export const getStaticPaths: GetStaticPaths = async () => ({
    paths: products.map(p => ({ params: { id: p.id } })),
    fallback: false,
});

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const product = products.find(p => p.id === params?.id);
    if (!product) return { notFound: true };
    return { props: { product } };
};
