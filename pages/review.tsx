import { GetStaticProps } from 'next';
import { ReviewView } from '../src/views/ReviewView';
import { catalogPageProps, PAGE_REVALIDATE_SECONDS } from '../src/lib/catalogServer';

export default function ReviewPage() {
    return <ReviewView />;
}

export const getStaticProps: GetStaticProps = async () => ({
    props: await catalogPageProps(),
    revalidate: PAGE_REVALIDATE_SECONDS,
});
