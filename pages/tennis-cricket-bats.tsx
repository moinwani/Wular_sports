import { GetStaticProps } from 'next';
import { TennisBatsPage } from '../src/views/TennisBatsPage';
import { catalogPageProps, PAGE_REVALIDATE_SECONDS } from '../src/lib/catalogServer';
import { guidesFor } from '../src/lib/guides';
import { Guide, TENNIS_HUB } from '../src/lib/seoContent';

/** Every tennis-ball bat (hard and soft) on one page — for "tennis cricket bat" searches */
export default function TennisCricketBatsPage({ guides }: { guides: Guide[] }) {
    return <TennisBatsPage guides={guides} />;
}

export const getStaticProps: GetStaticProps = async () => ({
    props: { ...(await catalogPageProps()), guides: await guidesFor(TENNIS_HUB.guides, 6) },
    revalidate: PAGE_REVALIDATE_SECONDS,
});
