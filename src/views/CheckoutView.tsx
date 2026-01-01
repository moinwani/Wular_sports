import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartItem } from '../types';

interface CheckoutViewProps {
    cart: CartItem[];
    total: number;
    onPlaceOrder: (orderDetails: any) => void;
}

export const CheckoutView: FC<CheckoutViewProps> = ({ cart, total, onPlaceOrder }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        paymentMethod: 'cod' // Default to COD
    });

    const calculateTotal = () => {
        return total;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Basic validation
        if (!formData.address || !formData.phone || !formData.firstName) {
            alert("Please fill in all required fields.");
            return;
        }

        onPlaceOrder({
            items: cart,
            total: calculateTotal(),
            shipping: formData,
            paymentMethod: formData.paymentMethod,
            orderDate: new Date().toISOString()
        });
    };

    if (cart.length === 0) {
        return (
            <div className="container checkout-empty">
                <h2>Your cart is empty</h2>
                <button className="btn" onClick={() => navigate('/')}>Continue Shopping</button>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <div className="container">
                <h1 className="page-title">Checkout</h1>

                <div className="checkout-grid">
                    {/* Left Column: Shipping Details */}
                    <div className="checkout-form-section">
                        <h2>Shipping Information</h2>
                        <form id="checkout-form" onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>First Name *</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Last Name *</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Phone Number *</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-group">
                                <label>Address *</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    placeholder="House no., Street name"
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>City *</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>State *</label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>ZIP Code *</label>
                                    <input
                                        type="text"
                                        name="zip"
                                        value={formData.zip}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="checkout-summary-section">
                        <h2>Order Summary</h2>
                        <div className="summary-items">
                            {cart.map((item, idx) => (
                                <div key={idx} className="summary-item">
                                    <div className="item-info">
                                        <span className="item-name">{item.name} {item.size ? `(${item.size})` : ''}</span>
                                        <span className="item-qty">x {item.quantity}</span>
                                    </div>
                                    <span className="item-price">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                                </div>
                            ))}
                        </div>

                        <div className="summary-totals">
                            <div className="total-row">
                                <span>Subtotal</span>
                                <span>₹{total.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="total-row">
                                <span>Shipping</span>
                                <span>Free</span>
                            </div>
                            <div className="total-row grand-total">
                                <span>Total</span>
                                <span>₹{total.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        <div className="payment-section">
                            <h3>Payment Method</h3>
                            <div className="payment-options">
                                <label className={`payment-option ${formData.paymentMethod === 'cod' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="cod"
                                        checked={formData.paymentMethod === 'cod'}
                                        onChange={handleInputChange}
                                    />
                                    <span>Cash on Delivery (COD)</span>
                                </label>
                                <label className={`payment-option ${formData.paymentMethod === 'online' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="online"
                                        checked={formData.paymentMethod === 'online'}
                                        onChange={handleInputChange}
                                    />
                                    <span>Online Payment (Razorpay)</span>
                                </label>
                            </div>
                            {formData.paymentMethod === 'online' && (
                                <p className="payment-note">Redirecting to secure payment gateway...</p>
                            )}
                        </div>

                        <button type="submit" form="checkout-form" className="btn-place-order">
                            PLACE ORDER
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
