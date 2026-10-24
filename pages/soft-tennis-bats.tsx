import { GetStaticProps } from 'next';
import { CategoryPage } from '../src/views/CategoryPage';
import { catalogPageProps, PAGE_REVALIDATE_SECONDS } from '../src/lib/catalogServer';

export default function SoftTennisBatsPage() {
    return <CategoryPage categoryId="soft-tennis" />;
}

export const getStaticProps: GetStaticProps = async () => ({
    props: await catalogPageProps(),
    revalidate: PAGE_REVALIDATE_SECONDS,
});
