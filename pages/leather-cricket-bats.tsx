import { GetStaticProps } from 'next';
import { CategoryPage } from '../src/views/CategoryPage';
import { catalogPageProps, PAGE_REVALIDATE_SECONDS } from '../src/lib/catalogServer';
import { guidesFor } from '../src/lib/guides';
import { CATEGORY_SEO, Guide } from '../src/lib/seoContent';

export default function LeatherCricketBatsPage({ guides }: { guides: Guide[] }) {
    return <CategoryPage categoryId="leather-ball" guides={guides} />;
}

export const getStaticProps: GetStaticProps = async () => ({
    props: { ...(await catalogPageProps()), guides: await guidesFor(CATEGORY_SEO['leather-ball'].guides) },
    revalidate: PAGE_REVALIDATE_SECONDS,
});
