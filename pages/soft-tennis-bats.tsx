import { GetStaticProps } from 'next';
import { CategoryPage } from '../src/views/CategoryPage';
import { catalogPageProps, PAGE_REVALIDATE_SECONDS } from '../src/lib/catalogServer';
import { guidesFor } from '../src/lib/guides';
import { CATEGORY_SEO, Guide } from '../src/lib/seoContent';

export default function SoftTennisBatsPage({ guides }: { guides: Guide[] }) {
    return <CategoryPage categoryId="soft-tennis" guides={guides} />;
}

export const getStaticProps: GetStaticProps = async () => ({
    props: { ...(await catalogPageProps()), guides: await guidesFor(CATEGORY_SEO['soft-tennis'].guides) },
    revalidate: PAGE_REVALIDATE_SECONDS,
});
