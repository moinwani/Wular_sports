import { FC } from 'react';
import { useNavigate } from 'react-router-dom';

export const OrderSuccessView: FC = () => {
    const navigate = useNavigate();

    return (
        <div className="order-success-page">
            <div className="container success-container">
                <i className="fas fa-check-circle success-icon"></i>
                <h1>Order Placed Successfully!</h1>
                <p>Thank you for shopping with Wular Sports. Your order has been received.</p>
                <div className="order-actions">
                    <button className="btn" onClick={() => navigate('/')}>Continue Shopping</button>
                    <button className="btn btn-outline" onClick={() => navigate('/collection')}>Browse Collection</button>
                </div>
            </div>
        </div>
    );
};
