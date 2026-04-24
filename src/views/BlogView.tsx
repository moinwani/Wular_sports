import { FC, useState } from 'react';
import { useRouter } from 'next/router';
import { blogs } from '../data/blogs';
import { SEOHead } from '../components/common/SEOHead';
import { subscribeToNewsletter } from '../services/newsletter';
import { useToast } from '../context/ToastContext';
import { getCDNUrl } from '../services/githubService';

export const BlogView: FC = () => {
    const router = useRouter();
    const { showToast } = useToast();
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setSubmitting(true);
        const result = await subscribeToNewsletter(email);
        showToast(result.message, result.success ? 'success' : (result.message.includes('already') ? 'info' : 'error'));
        if (result.success) setEmail('');
        setSubmitting(false);
    };

    return (
        <div className="blog-page">
            <SEOHead
                title="Cricket Bat Guides & Buying Tips | Wular Insights"
                description="Expert guides on Kashmiri willow cricket bats — how to choose the right bat, scoop vs non-scoop, bat maintenance, and insider tips from Wular Sports craftsmen."
                keywords="kashmiri willow cricket bat guide, cricket bat buying guide, scoop bat guide, hard tennis bat tips, soft tennis bat, cricket bat maintenance"
                canonicalUrl="https://wularsports.com/blog"
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
                            <article key={post.id} className="blog-card" onClick={() => router.push(`/blog/${post.id}`)} style={{ cursor: 'pointer' }}>
                                <div className="blog-card-image">
                                    <img src={getCDNUrl(post.image)} alt={post.title} />
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
            <section className="blog-cta">
                <div className="container">
                    <div className="blog-cta-box">
                        <h3>Stay in the Loop</h3>
                        <p>Get the latest bat maintenance tips and exclusive offers delivered to your inbox.</p>
                        <form className="blog-newsletter-form" onSubmit={handleSubscribe}>
                            <input type="email" placeholder="Your email address" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={submitting} />
                            <button type="submit" className="btn" disabled={submitting}>{submitting ? 'Subscribing...' : 'Subscribe'}</button>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
};
