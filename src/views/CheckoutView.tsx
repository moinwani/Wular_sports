import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartItem } from '../types';
import { useRazorpay } from '../hooks/useRazorpay';
import { createOrder, updateOrderStatus, updatePaymentStatus } from '../services/orders';
import { sendOrderConfirmation } from '../services/email';

interface CheckoutViewProps {
    cart: CartItem[];
    total: number;
    onPlaceOrder: (orderDetails: any) => void;
}

// Declare Razorpay on window
declare global {
    interface Window {
        Razorpay: any;
    }
}

export const CheckoutView: FC<CheckoutViewProps> = ({ cart, total, onPlaceOrder }) => {
    const navigate = useNavigate();
    const { isLoaded, loadRazorpay } = useRazorpay();
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        loadRazorpay();
    }, [loadRazorpay]);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        paymentMethod: 'cod'
    });
    const [formError, setFormError] = useState('');

    const calculateTotal = () => {
        return total;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handlePayment = async (orderId: string, orderDetails: any) => {
        if (!isLoaded) {
            setFormError('Payment gateway failed to load. Please verify your internet connection.');
            setIsProcessing(false);
            return;
        }

        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: total * 100, // Amount in paise
            currency: "INR",
            name: "Wular Sports",
            description: "Purchase from Wular Sports",
            image: "https://res.cloudinary.com/ddahm5ebv/image/upload/v1752992278/6334704126398678409-removebg-preview_dvxsud.png",
            order_id: "", // In production, generate this on backend!
            handler: async function (response: any) {
                try {
                    // Payment successful
                    await updatePaymentStatus(orderId, 'completed', response.razorpay_payment_id);
                    await updateOrderStatus(orderId, 'confirmed');

                    // Send email confirmation
                    sendOrderConfirmation(orderDetails);

                    onPlaceOrder({
                        id: orderId,
                        items: cart,
                        total: calculateTotal(),
                        shipping: formData,
                        paymentMethod: 'online',
                        paymentId: response.razorpay_payment_id,
                        orderDate: new Date().toISOString()
                    });
                } catch (error) {
                    console.error("Error updating order after payment:", error);
                    setFormError("Payment successful but failed to update order. Please contact support.");
                } finally {
                    setIsProcessing(false);
                }
            },
            prefill: {
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                contact: formData.phone
            },
            notes: {
                address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.zip}`
            },
            theme: {
                color: "#d4af37"
            },
            modal: {
                ondismiss: function () {
                    setIsProcessing(false);
                }
            }
        };

        const rzp1 = new window.Razorpay(options);
        rzp1.on('payment.failed', function (response: any) {
            console.error("Payment failed:", response.error);
            setFormError(`Payment failed: ${response.error.description}`);
            setIsProcessing(false);
        });
        rzp1.open();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.address || !formData.phone || !formData.firstName) {
            setFormError("Please fill in all required fields (marked associated with *).");
            return;
        }

        setFormError('');
        setIsProcessing(true);

        try {
            // 1. Create Order in Firebase
            const orderData = {
                customerName: `${formData.firstName} ${formData.lastName}`,
                customerEmail: formData.email,
                customerPhone: formData.phone,
                customerAddress: {
                    street: formData.address,
                    city: formData.city,
                    state: formData.state,
                    pincode: formData.zip
                },
                items: cart.map(item => ({
                    productId: item.id,
                    productName: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    size: item.size
                })),
                total: total,
                status: 'pending' as const,
                paymentStatus: 'pending' as const,
                paymentMethod: formData.paymentMethod
            };

            const orderId = await createOrder(orderData);

            // Prepare order object for email (combining ID with data)
            const fullOrderDetails = {
                id: orderId,
                ...orderData
            };

            if (formData.paymentMethod === 'cod') {
                // Send email confirmation
                await sendOrderConfirmation(fullOrderDetails);

                // For COD, we are done
                onPlaceOrder({
                    id: orderId,
                    items: cart,
                    total: calculateTotal(),
                    shipping: formData,
                    paymentMethod: 'cod',
                    orderDate: new Date().toISOString()
                });
                setIsProcessing(false);
            } else {
                // For Online Payment, trigger Razorpay
                await handlePayment(orderId, fullOrderDetails);
            }

        } catch (error) {
            console.error("Order creation failed:", error);
            setFormError("Failed to place order. Please try again.");
            setIsProcessing(false);
        }
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
                {formError && (
                    <div className="alert-error" role="alert" aria-live="assertive">
                        <i className="fas fa-exclamation-circle"></i> {formError}
                    </div>
                )}

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
                                        disabled={isProcessing}
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
                                        disabled={isProcessing}
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
                                    disabled={isProcessing}
                                />
                            </div>

                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    disabled={isProcessing}
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
                                    disabled={isProcessing}
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
                                        disabled={isProcessing}
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
                                        disabled={isProcessing}
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
                                        disabled={isProcessing}
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

                        {/* Secure Payment Badges */}
                        <div className="secure-payment-badges">
                            <div className="secure-badge">
                                <i className="fas fa-lock"></i>
                                <span>SSL Secured</span>
                            </div>
                            <div className="secure-badge">
                                <i className="fas fa-shield-alt"></i>
                                <span>256-bit Encryption</span>
                            </div>
                            <div className="secure-badge">
                                <i className="fas fa-check-circle"></i>
                                <span>PCI Compliant</span>
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
                                        disabled={isProcessing}
                                    />
                                    <div className="payment-option-content">
                                        <span><i className="fas fa-money-bill-wave"></i> Cash on Delivery (COD)</span>
                                        <small>Pay when you receive</small>
                                    </div>
                                </label>
                                <label className={`payment-option ${formData.paymentMethod === 'online' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="online"
                                        checked={formData.paymentMethod === 'online'}
                                        onChange={handleInputChange}
                                        disabled={isProcessing}
                                    />
                                    <div className="payment-option-content">
                                        <span><i className="fas fa-credit-card"></i> Online Payment (Razorpay)</span>
                                        <small>Secure payment gateway</small>
                                    </div>
                                </label>
                            </div>
                            {formData.paymentMethod === 'online' && (
                                <div className="payment-security-note">
                                    <i className="fas fa-info-circle"></i>
                                    <p>You will be redirected to Razorpay to complete your secure payment. All transactions are encrypted and secure.</p>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            form="checkout-form"
                            className="btn-place-order"
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <span className="btn-spinner"><i className="fas fa-spinner fa-spin"></i> Processing...</span>
                            ) : (
                                "PLACE ORDER"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
