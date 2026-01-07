import { FC } from 'react';
import { View } from '../types';
import { blogs } from '../data/blogs';
import { SEOHead } from '../components/common/SEOHead';

interface BlogViewProps {
    onNavigate: (view: View, hash?: string) => void;
    onSelectPost: (postId: string) => void;
}

export const BlogView: FC<BlogViewProps> = ({ onSelectPost }) => {
    return (
        <div className="blog-page">
            <SEOHead
                title="Cricket Insights & Guides | Wular Sports Blog"
                description="Expert tips on choosing the right cricket bat, maintenance guides, and inside stories from Wular Sports."
            />

            <section className="blog-hero">
                <div className="container">
                    <h1 className="blog-main-title">Wular <span>Insights</span></h1>
                    <p className="blog-hero-desc">Expert advice, craftsmanship stories, and guides for the modern cricketer.</p>
                </div>
            </section>

            <section className="blog-grid-section">
                <div className="container">
                    <div className="blog-grid">
                        {blogs.map(post => (
                            <article key={post.id} className="blog-card" onClick={() => onSelectPost(post.id)}>
                                <div className="blog-card-image">
                                    <img src={post.image} alt={post.title} />
                                    <span className="blog-category-tag">{post.category}</span>
                                </div>
                                <div className="blog-card-content">
                                    <div className="blog-meta">
                                        <span><i className="far fa-calendar"></i> {post.date}</span>
                                        <span><i className="far fa-clock"></i> {post.readTime}</span>
                                    </div>
                                    <h2 className="blog-card-title">{post.title}</h2>
                                    <p className="blog-card-desc">{post.description}</p>
                                    <button className="blog-read-more">Read Article <i className="fas fa-arrow-right"></i></button>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* Newsletter/CTA */}
            <section className="blog-cta">
                <div className="container">
                    <div className="blog-cta-box">
                        <h3>Stay in the Loop</h3>
                        <p>Get the latest bat maintenance tips and exclusive offers delivered to your inbox.</p>
                        <form className="blog-newsletter-form" onSubmit={(e) => e.preventDefault()}>
                            <input type="email" placeholder="Your email address" required />
                            <button type="submit" className="btn">Subscribe</button>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
};
