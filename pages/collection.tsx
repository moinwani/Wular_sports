import { GetStaticProps } from 'next';
import { CollectionView } from '../src/views/CollectionView';
import { catalogPageProps, PAGE_REVALIDATE_SECONDS } from '../src/lib/catalogServer';

export default function CollectionPage() {
    return <CollectionView />;
}

export const getStaticProps: GetStaticProps = async () => ({
    props: await catalogPageProps(),
    revalidate: PAGE_REVALIDATE_SECONDS,
});
