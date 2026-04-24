import { GetStaticProps } from 'next';
import { CollectionView } from '../src/views/CollectionView';
import { products } from '../src/data/products';
import { ProductFull } from '../src/types';

interface Props { products: ProductFull[]; }

export default function CollectionPage({ products }: Props) {
    return <CollectionView products={products} />;
}

export const getStaticProps: GetStaticProps = async () => {
    return { props: { products } };
};
