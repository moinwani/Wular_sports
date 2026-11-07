import { GetStaticProps } from 'next';
import { BlogView } from '../../src/views/BlogView';
import { BlogPost } from '../../src/types';
import { blogForPage, BLOG_REVALIDATE_SECONDS } from '../../src/lib/blogServer';
import { livePosts, toSummary } from '../../src/lib/blog';

interface Props { blogs: BlogPost[]; }

export default function BlogPage({ blogs }: Props) {
    return <BlogView blogs={blogs} />;
}

export const getStaticProps: GetStaticProps<Props> = async () => {
    const { posts } = await blogForPage();
    // The list only needs titles and summaries — not every article's full text
    const blogs = livePosts(posts).map(p => ({ ...toSummary(p), content: '' })) as BlogPost[];
    return { props: { blogs }, revalidate: BLOG_REVALIDATE_SECONDS };
};
