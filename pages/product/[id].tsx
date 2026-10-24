import { GetStaticPaths, GetStaticProps } from 'next';
import { ProductDetailsView } from '../../src/views/ProductDetailsView';
import { ProductFull } from '../../src/types';
import { useCart } from '../../src/context/CartContext';
import { useToast } from '../../src/context/ToastContext';
import { catalogForPage, catalogPageProps, PAGE_REVALIDATE_SECONDS } from '../../src/lib/catalogServer';
import { visibleProducts } from '../../src/lib/catalog';

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

export const getStaticPaths: GetStaticPaths = async () => {
    const { products } = await catalogForPage();
    return {
        paths: visibleProducts(products).map(p => ({ params: { id: p.id } })),
        // Products added in the admin panel are built on their first visit
        fallback: 'blocking',
    };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const props = await catalogPageProps();
    const product = props.catalog.products.find(p => p.id === params?.id);
    if (!product) return { notFound: true, revalidate: 60 };
    return { props: { ...props, product }, revalidate: PAGE_REVALIDATE_SECONDS };
};
