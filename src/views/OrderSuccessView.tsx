import { FC, useEffect } from 'react';
import { useRouter } from 'next/router';
import { SEOHead } from '../components/common/SEOHead';
import { Icon } from '../components/common/Icon';

export const OrderSuccessView: FC = () => {
    const router = useRouter();
    const orderId = router.query.id as string || '';

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="view order-success-view">
            <SEOHead
                title="Order Confirmed | Wular Sports"
                description="Thank you for your order. We have received your request."
            />
            <div className="container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <div className="success-icon" style={{
                    fontSize: '4rem',
                    color: '#4CAF50',
                    marginBottom: '1.5rem',
                    animation: 'fadeInUp 0.6s ease'
                }}>
                    <Icon name="fa-check-circle" />
                </div>

                <h1 style={{
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: '2.5rem',
                    color: '#d4af37',
                    marginBottom: '1rem'
                }}>
                    Order Placed Successfully!
                </h1>

                {orderId && (
                    <p style={{
                        fontSize: '0.95rem',
                        color: '#888',
                        marginBottom: '1.5rem',
                    }}>
                        Your Order ID: <strong style={{ color: '#d4af37' }}>{orderId}</strong>
                    </p>
                )}

                <p style={{
                    fontSize: '1.2rem',
                    maxWidth: '600px',
                    margin: '0 auto 2rem',
                    lineHeight: '1.6',
                    color: '#ddd'
                }}>
                    Your order has been placed successfully. Thanks for shopping with Wular Sports. We'll reach out to you shortly with your delivery details.
                </p>

                <div className="actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button
                        className="btn"
                        onClick={() => router.push('/collection')}
                        style={{ padding: '1rem 2rem' }}
                    >
                        Continue Shopping
                    </button>
                    <button
                        className="btn btn-outline"
                        onClick={() => router.push('/')}
                        style={{ padding: '1rem 2rem' }}
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};
