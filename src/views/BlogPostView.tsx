import { FC, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DOMPurify from 'isomorphic-dompurify';
import { BlogPost } from '../types';
import { blogs } from '../data/blogs';
import { SEOHead } from '../components/common/SEOHead';
import { getCDNUrl } from '../services/githubService';
import { Icon } from '../components/common/Icon';

interface BlogPostViewProps {
    post: BlogPost;
}

export const BlogPostView: FC<BlogPostViewProps> = ({ post }) => {
    const router = useRouter();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [post.id]);

    const otherPosts = blogs.filter(b => b.id !== post.id).slice(0, 2);

    const sanitizedContent = useMemo(() => DOMPurify.sanitize(post.content), [post.content]);

    const faqSchema = post.faq && post.faq.length > 0 ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": post.faq.map(item => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": { "@type": "Answer", "text": item.answer }
        }))
    } : null;

    return (
        <div className="blog-post-page">
            <SEOHead
                title={`${post.title} | Wular Sports Blog`}
                description={post.description}
                canonicalUrl={`https://wularsports.com/blog/${post.id}`}
                structuredData={faqSchema ?? undefined}
            />

            <article className="blog-post-container">
                <header className="blog-post-header">
                    <div className="container">
                        <button className="blog-back-btn" onClick={() => router.push('/blog')}>
                            <Icon name="fa-chevron-left" /> Back to Blog
                        </button>
                        <div className="blog-post-meta-top">
                            <span className="post-category">{post.category}</span>
                            <span className="post-dot"></span>
                            <span className="post-read-time">{post.readTime}</span>
                        </div>
                        <h1 className="blog-post-title">{post.title}</h1>
                        <div className="blog-post-author-row">
                            <div className="author-avatar"><Icon name="fa-user-circle" /></div>
                            <div className="author-info">
                                <span className="author-name">{post.author}</span>
                                <span className="post-date">{post.date}</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="blog-post-main-image">
                    <div className="container">
                        <img src={getCDNUrl(post.image)} alt={post.title} />
                    </div>
                </div>

                <div className="blog-post-content-wrapper">
                    <div className="container narrow">
                        <div className="blog-content-body" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
                        <div className="blog-post-footer">
                            <div className="share-post">
                                <span>Share this article:</span>
                                <div className="share-links">
                                    <a href={`https://wa.me/?text=${encodeURIComponent(post.title + ' https://wularsports.com/blog/' + post.id)}`} target="_blank" rel="noreferrer">
                                        <Icon name="fa-whatsapp" />
                                    </a>
                                    <a href="#" onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText(`https://wularsports.com/blog/${post.id}`); alert('Link copied!'); }}>
                                        <Icon name="fa-link" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </article>

            {otherPosts.length > 0 && (
                <section className="more-articles">
                    <div className="container">
                        <h3 className="more-articles-title">Continue Reading</h3>
                        <div className="blog-grid">
                            {otherPosts.map(p => (
                                <article key={p.id} className="blog-card" onClick={() => router.push(`/blog/${p.id}`)} style={{ cursor: 'pointer' }}>
                                    <div className="blog-card-image">
                                        <img src={getCDNUrl(p.image)} alt={p.title} />
                                    </div>
                                    <div className="blog-card-content">
                                        <h4 className="blog-card-title">{p.title}</h4>
                                        <button className="blog-read-more">Read Article</button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};
