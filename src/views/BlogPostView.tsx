import { FC, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { View } from '../types';
import { blogs } from '../data/blogs';
import { SEOHead } from '../components/common/SEOHead';
import { getCDNUrl } from '../services/githubService';

interface BlogPostViewProps {
    onNavigate: (view: View) => void;
    onSelectPost: (postId: string) => void;
}

export const BlogPostView: FC<BlogPostViewProps> = ({ onNavigate, onSelectPost }) => {
    const { postId } = useParams<{ postId: string }>();
    const post = blogs.find(b => b.id === postId);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [postId]);

    if (!post) {
        return (
            <div className="container" style={{ padding: '10rem 0', textAlign: 'center' }}>
                <h2>Article not found</h2>
                <button className="btn" onClick={() => onNavigate('blog')}>Back to Blog</button>
            </div>
        );
    }

    const otherPosts = blogs.filter(b => b.id !== postId).slice(0, 2);

    return (
        <div className="blog-post-page">
            <SEOHead
                title={`${post.title} | Wular Sports Blog`}
                description={post.description}
            />

            <article className="blog-post-container">
                <header className="blog-post-header">
                    <div className="container">
                        <button className="blog-back-btn" onClick={() => onNavigate('blog')}>
                            <i className="fas fa-chevron-left"></i> Back to Blog
                        </button>
                        <div className="blog-post-meta-top">
                            <span className="post-category">{post.category}</span>
                            <span className="post-dot"></span>
                            <span className="post-read-time">{post.readTime}</span>
                        </div>
                        <h1 className="blog-post-title">{post.title}</h1>
                        <div className="blog-post-author-row">
                            <div className="author-avatar">
                                <i className="fas fa-user-circle"></i>
                            </div>
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
                        <div
                            className="blog-content-body"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />

                        <div className="blog-post-footer">
                            <div className="share-post">
                                <span>Share this article:</span>
                                <div className="share-links">
                                    <a href={`https://wa.me/?text=${encodeURIComponent(post.title + ' ' + window.location.href)}`} target="_blank" rel="noreferrer">
                                        <i className="fab fa-whatsapp"></i>
                                    </a>
                                    <a href="#" onClick={(e) => {
                                        e.preventDefault();
                                        navigator.clipboard.writeText(window.location.href);
                                        alert('Link copied to clipboard!');
                                    }}>
                                        <i className="fas fa-link"></i>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </article>

            {/* Related Posts */}
            {otherPosts.length > 0 && (
                <section className="more-articles">
                    <div className="container">
                        <h3 className="more-articles-title">Continue Reading</h3>
                        <div className="blog-grid">
                            {otherPosts.map(p => (
                                <article key={p.id} className="blog-card" onClick={() => onSelectPost(p.id)}>
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
