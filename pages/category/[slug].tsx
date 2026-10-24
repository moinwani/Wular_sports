import { GetStaticPaths, GetStaticProps } from 'next';
import { CategoryPage } from '../../src/views/CategoryPage';
import { catalogForPage, catalogPageProps, PAGE_REVALIDATE_SECONDS } from '../../src/lib/catalogServer';

/** Categories created in Admin → Products (the three original ones keep their own addresses). */
export default function NewCategoryPage({ categoryId }: { categoryId: string }) {
    return <CategoryPage categoryId={categoryId} />;
}

export const getStaticPaths: GetStaticPaths = async () => {
    const { categories } = await catalogForPage();
    return {
        paths: categories.filter(c => !c.builtIn).map(c => ({ params: { slug: c.id } })),
        // Categories added later are built on their first visit
        fallback: 'blocking',
    };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const props = await catalogPageProps();
    const category = props.catalog.categories.find(c => c.id === params?.slug && !c.builtIn);
    if (!category) return { notFound: true, revalidate: 60 };
    return { props: { ...props, categoryId: category.id }, revalidate: PAGE_REVALIDATE_SECONDS };
};
