import { FC, useState, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '../common/Icon';
import { Review } from '../../services/reviews';

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

    useEffect(() => {
        let cancelled = false;
        import('../../services/reviews')
            .then(({ getApprovedReviews }) => getApprovedReviews(productId))
            .then(r => { if (!cancelled) setReviews(r); })
            .catch(() => { if (!cancelled) setReviews([]); });
        return () => { cancelled = true; };
    }, [productId]);

    if (reviews === null) return null;

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
