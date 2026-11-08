import { FC, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Icon } from '../common/Icon';
import type { Review } from '../../services/reviews';

interface ProductReviewsProps {
    productId: string;
}

const Stars: FC<{ value: number }> = ({ value }) => (
    <span className="review-stars" aria-label={`${value} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map(s => (
            <Icon key={s} name="fa-star" className={s <= Math.round(value) ? 'star-on' : 'star-off'} />
        ))}
    </span>
);

/**
 * Approved customer reviews for a product, with an average-rating header.
 * Renders nothing while loading and a "be the first" invite when empty.
 */
export const ProductReviews: FC<ProductReviewsProps> = ({ productId }) => {
    const [reviews, setReviews] = useState<Review[] | null>(null);
    const [near, setNear] = useState(false);
    const markerRef = useRef<HTMLDivElement>(null);

    // Reviews sit far down the page: fetch them (and the Firebase library they
    // need) only when the shopper scrolls towards them, so they never slow
    // down the bat photos at the top.
    useEffect(() => {
        if (near) return;
        const el = markerRef.current;
        if (!el || typeof IntersectionObserver === 'undefined') { setNear(true); return; }
        const io = new IntersectionObserver(entries => {
            if (entries.some(e => e.isIntersecting)) { setNear(true); io.disconnect(); }
        }, { rootMargin: '800px 0px' });
        io.observe(el);
        return () => io.disconnect();
    }, [near]);

    useEffect(() => {
        if (!near) return;
        let cancelled = false;
        import('../../services/reviews')
            .then(({ getApprovedReviews }) => getApprovedReviews(productId))
            .then(r => { if (!cancelled) setReviews(r); })
            .catch(() => { if (!cancelled) setReviews([]); });
        return () => { cancelled = true; };
    }, [near, productId]);

    if (reviews === null) return <div ref={markerRef} aria-hidden="true" />;

    if (reviews.length === 0) {
        return (
            <section className="product-reviews">
                <h2 className="section-title">Customer Reviews</h2>
                <p className="reviews-empty">
                    No reviews yet — bought this bat?{' '}
                    <Link href={`/review?product=${productId}`}>Be the first to review it</Link> 🏏
                </p>
            </section>
        );
    }

    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    return (
        <section className="product-reviews">
            <h2 className="section-title">Customer Reviews</h2>
            <div className="reviews-summary">
                <span className="reviews-avg">{avg.toFixed(1)}</span>
                <div>
                    <Stars value={avg} />
                    <p className="reviews-count">Based on {reviews.length} review{reviews.length > 1 ? 's' : ''}</p>
                </div>
            </div>

            <div className="reviews-list">
                {reviews.map(review => (
                    <div key={review.id} className="review-item">
                        <div className="review-item__head">
                            <Stars value={review.rating} />
                            <span className="review-item__meta">
                                {review.name || 'Verified Buyer'}
                                {review.city ? ` · ${review.city}` : ''}
                            </span>
                        </div>
                        {review.text && <p className="review-item__text">{review.text}</p>}
                    </div>
                ))}
            </div>

            <Link href={`/review?product=${productId}`} className="reviews-write-link">
                <Icon name="fa-star" /> Write a review
            </Link>
        </section>
    );
};
