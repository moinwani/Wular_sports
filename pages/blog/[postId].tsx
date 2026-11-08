import { GetStaticPaths, GetStaticProps } from 'next';
import { BlogPostView } from '../../src/views/BlogPostView';
import { BlogPost } from '../../src/types';
import { blogForPage, BLOG_REVALIDATE_SECONDS } from '../../src/lib/blogServer';
import { cleanArticleHtml } from '../../src/lib/articleHtml';
import { absoluteUrl, isLive, isoDateOf, livePosts, relatedTo, toSummary } from '../../src/lib/blog';

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
    const found = posts.find(b => b.id === params?.postId);
    // Drafts and deleted posts are not on the website
    if (!found || !isLive(found)) return { notFound: true, revalidate: 60 };
    // Cleaned here on the server — visitors' phones never download a sanitiser
    const post = { ...found, content: cleanArticleHtml(found.content) };
    const relatedPosts = relatedTo(post, posts).map(p => ({ ...toSummary(p), content: '' })) as BlogPost[];

    const published = isoDateOf(post);
    const isTeam = /team|wular sports/i.test(post.author);
    const words = post.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    const articleSchema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BlogPosting",
                "headline": post.title.slice(0, 110),
                "description": post.description,
                "image": [absoluteUrl(post.image)],
                "datePublished": published || post.date,
                "dateModified": post.modifiedAt || published || post.date,
                "inLanguage": "en-IN",
                "articleSection": post.category,
                "wordCount": words,
                // "Wular Sports Team" is the business, not a person
                "author": isTeam
                    ? { "@type": "Organization", "name": "Wular Sports", "url": "https://wularsports.com" }
                    : { "@type": "Person", "name": post.author },
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
            ...(post.faq?.length ? [{
                "@type": "FAQPage",
                "mainEntity": post.faq.map(f => ({
                    "@type": "Question",
                    "name": f.question,
                    "acceptedAnswer": { "@type": "Answer", "text": f.answer },
                })),
            }] : []),
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
