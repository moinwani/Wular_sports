import { GetStaticPaths, GetStaticProps } from 'next';
import { BlogPostView } from '../../src/views/BlogPostView';
import { BlogPost } from '../../src/types';
import { blogForPage, BLOG_REVALIDATE_SECONDS } from '../../src/lib/blogServer';
import { isLive, isoDateOf, livePosts, relatedTo, toSummary } from '../../src/lib/blog';

interface Props {
    post: BlogPost;
    relatedPosts: BlogPost[];
    articleSchema: object;
}

export default function BlogPostPage({ post, relatedPosts, articleSchema }: Props) {
    return <BlogPostView post={post} relatedPosts={relatedPosts} articleSchema={articleSchema} />;
}

export const getStaticPaths: GetStaticPaths = async () => {
    const { posts } = await blogForPage();
    return {
        paths: livePosts(posts).map(b => ({ params: { postId: b.id } })),
        // Posts written in the admin panel are built on their first visit
        fallback: 'blocking',
    };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
    const { posts } = await blogForPage();
    const post = posts.find(b => b.id === params?.postId);
    // Drafts and deleted posts are not on the website
    if (!post || !isLive(post)) return { notFound: true, revalidate: 60 };
    const relatedPosts = relatedTo(post, posts).map(p => ({ ...toSummary(p), content: '' })) as BlogPost[];

    const articleSchema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BlogPosting",
                "headline": post.title,
                "description": post.description,
                "image": post.image,
                "datePublished": isoDateOf(post) || post.date,
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

    return { props: { post, relatedPosts, articleSchema }, revalidate: BLOG_REVALIDATE_SECONDS };
};
