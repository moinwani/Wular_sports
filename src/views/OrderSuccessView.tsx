import { FC, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '../components/common/SEOHead';

export const OrderSuccessView: FC = () => {
    const navigate = useNavigate();

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
                    <i className="fas fa-check-circle"></i>
                </div>

                <h1 style={{
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: '2.5rem',
                    color: '#d4af37',
                    marginBottom: '1rem'
                }}>
                    Order Placed Successfully!
                </h1>

                <p style={{
                    fontSize: '1.2rem',
                    maxWidth: '600px',
                    margin: '0 auto 2rem',
                    lineHeight: '1.6',
                    color: '#ddd'
                }}>
                    Thank you for shopping with Wular Sports. We have sent a confirmation email to your inbox.
                    Our team will process your order shortly.
                </p>

                <div className="actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button
                        className="btn"
                        onClick={() => navigate('/collection')}
                        style={{ padding: '1rem 2rem' }}
                    >
                        Continue Shopping
                    </button>
                    <button
                        className="btn btn-outline"
                        onClick={() => navigate('/')}
                        style={{ padding: '1rem 2rem' }}
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};
