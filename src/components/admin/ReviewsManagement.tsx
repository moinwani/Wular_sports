import { FC, useState, useEffect, useMemo } from 'react';
import { getAllReviews, approveReview, deleteReview, Review } from '../../services/reviews';
import { products } from '../../data/products';
import { Icon } from '../common/Icon';

export const ReviewsManagement: FC = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'all'>('pending');

    const load = async () => {
        try {
            setLoading(true);
            setReviews(await getAllReviews());
            setError(null);
        } catch (err) {
            console.error('Failed to fetch reviews:', err);
            setError('Failed to fetch reviews — make sure the latest Firestore rules are published.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const filtered = useMemo(
        () => statusFilter === 'all' ? reviews : reviews.filter(r => r.status === statusFilter),
        [reviews, statusFilter]
    );

    const productName = (id: string) =>
        products.find(p => p.id === id)?.name || id;

    const handleApprove = async (id: string) => {
        try {
            await approveReview(id);
            setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
        } catch {
            alert('Failed to approve review');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this review permanently?')) return;
        try {
            await deleteReview(id);
            setReviews(prev => prev.filter(r => r.id !== id));
        } catch {
            alert('Failed to delete review');
        }
    };

    if (loading) {
        return (
            <div className="admin-loading">
                <div className="loading-spinner"></div>
                <p>Loading reviews...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-error">
                <p>{error}</p>
                <button className="btn" onClick={load}>Retry</button>
            </div>
        );
    }

    return (
        <div className="reviews-management">
            <div className="management-header">
                <h1>Customer Reviews</h1>
                <p className="order-count">{filtered.length} reviews</p>
            </div>

            <p className="dashboard-hint">
                ⭐ Reviews only appear on the website after you approve them here. Approve the genuine ones — they're your strongest sales tool.
            </p>

            <div className="orders-filters">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="status-filter"
                >
                    <option value="pending">Awaiting Approval</option>
                    <option value="approved">Live on Site</option>
                    <option value="all">All</option>
                </select>
                <button className="btn" onClick={load}><Icon name="fa-redo-alt" /> Refresh</button>
            </div>

            {filtered.length === 0 ? (
                <div className="empty-state">
                    <Icon name="fa-star" style={{ fontSize: '48px', color: '#666' }} />
                    <p>No reviews here yet.</p>
                </div>
            ) : (
                <div className="reviews-moderation-list">
                    {filtered.map(review => (
                        <div key={review.id} className="review-mod-card">
                            <div className="review-mod-card__head">
                                <span className="review-stars">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Icon key={s} name="fa-star" className={s <= review.rating ? 'star-on' : 'star-off'} />
                                    ))}
                                </span>
                                <span className={`status-badge status-${review.status === 'approved' ? 'delivered' : 'pending'}`}>
                                    {review.status === 'approved' ? 'live' : 'pending'}
                                </span>
                            </div>
                            <p className="review-mod-card__product">{productName(review.productId)}</p>
                            {review.text && <p className="review-item__text">"{review.text}"</p>}
                            <p className="review-item__meta">
                                — {review.name || 'Anonymous'}{review.city ? `, ${review.city}` : ''}
                                {review.createdAt ? ` · ${review.createdAt.toLocaleDateString()}` : ''}
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                {review.status !== 'approved' && (
                                    <button
                                        className="btn-view"
                                        onClick={() => handleApprove(review.id)}
                                        title="Approve — goes live on the product page"
                                        style={{ backgroundColor: '#388e3c' }}
                                    >
                                        <Icon name="fa-check" /> Approve
                                    </button>
                                )}
                                <button
                                    className="btn-view"
                                    onClick={() => handleDelete(review.id)}
                                    title="Delete review"
                                    style={{ backgroundColor: '#8b0000' }}
                                >
                                    <Icon name="fa-times" /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
