import { GetStaticPaths, GetStaticProps } from 'next';
import { BlogPostView } from '../../src/views/BlogPostView';
import { blogs } from '../../src/data/blogs';
import { BlogPost } from '../../src/types';

interface Props {
    post: BlogPost;
    relatedPosts: BlogPost[];
    articleSchema: object;
}

export default function BlogPostPage({ post, relatedPosts, articleSchema }: Props) {
    return <BlogPostView post={post} relatedPosts={relatedPosts} articleSchema={articleSchema} />;
}

export const getStaticPaths: GetStaticPaths = async () => ({
    paths: blogs.map(b => ({ params: { postId: b.id } })),
    fallback: false,
});

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
    const post = blogs.find(b => b.id === params?.postId);
    if (!post) return { notFound: true };
    const relatedPosts = blogs.filter(b => b.id !== post.id).slice(0, 2);

    const articleSchema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BlogPosting",
                "headline": post.title,
                "description": post.description,
                "image": post.image,
                "datePublished": post.date,
                "author": {
                    "@type": "Person",
                    "name": post.author,
                },
                "publisher": {
                    "@type": "Organization",
                    "name": "Wular Sports",
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://cdn.jsdelivr.net/gh/moinwani/Wular_sports@main/assets/images/brand/logo.png",
                    },
                },
                "mainEntityOfPage": {
                    "@type": "WebPage",
                    "@id": `https://wularsports.com/blog/${post.id}`,
                },
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://wularsports.com" },
                    { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://wularsports.com/blog" },
                    { "@type": "ListItem", "position": 3, "name": post.title },
                ],
            },
        ],
    };

    return { props: { post, relatedPosts, articleSchema } };
};
