import { FC, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { products } from '../data/products';
import { SEOHead } from '../components/common/SEOHead';
import { Icon } from '../components/common/Icon';

export const ReviewView: FC = () => {
    const router = useRouter();
    const [productId, setProductId] = useState('');
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [text, setText] = useState('');
    const [name, setName] = useState('');
    const [city, setCity] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    // Preselect the product from ?product= in the review link
    useEffect(() => {
        const fromQuery = router.query.product;
        if (typeof fromQuery === 'string' && products.some(p => p.id === fromQuery)) {
            setProductId(fromQuery);
        }
    }, [router.query.product]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productId) { setError('Please select the bat you bought.'); return; }
        if (rating < 1) { setError('Please tap the stars to rate your bat.'); return; }
        setBusy(true);
        setError('');
        try {
            const { submitReview } = await import('../services/reviews');
            await submitReview({ productId, rating, text, name, city });
            setDone(true);
            if (typeof window !== 'undefined' && (window as any).dataLayer) {
                (window as any).dataLayer.push({ event: 'review_submitted', product_id: productId, rating });
            }
        } catch {
            setError('Could not submit your review. Please try again.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="review-page">
            <SEOHead
                title="Rate Your Bat | Wular Sports"
                description="Share your experience with your Wular Sports Kashmiri willow cricket bat."
                canonicalUrl="https://wularsports.com/review"
            />
            <div className="container">
                <div className="review-card">
                    {done ? (
                        <div className="review-thanks">
                            <div className="review-thanks__emoji">🙏</div>
                            <h1>Thank you!</h1>
                            <p>Your review has been received and will appear on the site once approved. It means a lot to a small workshop like ours.</p>
                            <button className="btn" onClick={() => router.push('/')}>Back to Home</button>
                        </div>
                    ) : (
                        <>
                            <h1>Rate Your Bat 🏏</h1>
                            <p className="review-sub">30 seconds — your review helps fellow cricketers choose right.</p>

                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Which bat did you buy? *</label>
                                    <select
                                        value={productId}
                                        onChange={(e) => setProductId(e.target.value)}
                                        required
                                        disabled={busy}
                                    >
                                        <option value="">Select your bat…</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Your rating *</label>
                                    <div className="star-picker" role="radiogroup" aria-label="Rating">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                className={`star-btn ${(hoverRating || rating) >= star ? 'active' : ''}`}
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                aria-label={`${star} star${star > 1 ? 's' : ''}`}
                                            >
                                                <Icon name="fa-star" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Your review</label>
                                    <textarea
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        placeholder="How does it feel? Power, pickup, build quality…"
                                        rows={4}
                                        maxLength={1000}
                                        disabled={busy}
                                    />
                                </div>

                                <div className="form-row compact">
                                    <div className="form-group">
                                        <label>Your name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g. Rahul S."
                                            maxLength={60}
                                            disabled={busy}
                                            autoComplete="name"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>City</label>
                                        <input
                                            type="text"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            placeholder="e.g. Mumbai"
                                            maxLength={60}
                                            disabled={busy}
                                            autoComplete="address-level2"
                                        />
                                    </div>
                                </div>

                                {error && <span className="error-message">{error}</span>}

                                <button type="submit" className="btn-place-order" disabled={busy}>
                                    {busy ? 'Submitting…' : 'Submit Review'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
