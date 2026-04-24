import { GetStaticPaths, GetStaticProps } from 'next';
import { BlogPostView } from '../../src/views/BlogPostView';
import { blogs } from '../../src/data/blogs';
import { BlogPost } from '../../src/types';

interface Props { post: BlogPost; }

export default function BlogPostPage({ post }: Props) {
    return <BlogPostView post={post} />;
}

export const getStaticPaths: GetStaticPaths = async () => ({
    paths: blogs.map(b => ({ params: { postId: b.id } })),
    fallback: false,
});

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const post = blogs.find(b => b.id === params?.postId);
    if (!post) return { notFound: true };
    return { props: { post } };
};
