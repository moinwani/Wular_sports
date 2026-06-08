import { GetStaticPaths, GetStaticProps } from 'next';
import { BlogPostView } from '../../src/views/BlogPostView';
import { blogs } from '../../src/data/blogs';
import { BlogPost } from '../../src/types';

interface Props {
    post: BlogPost;
    relatedPosts: BlogPost[];
}

export default function BlogPostPage({ post, relatedPosts }: Props) {
    return <BlogPostView post={post} relatedPosts={relatedPosts} />;
}

export const getStaticPaths: GetStaticPaths = async () => ({
    paths: blogs.map(b => ({ params: { postId: b.id } })),
    fallback: false,
});

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
    const post = blogs.find(b => b.id === params?.postId);
    if (!post) return { notFound: true };
    const relatedPosts = blogs.filter(b => b.id !== post.id).slice(0, 2);
    return { props: { post, relatedPosts } };
};
