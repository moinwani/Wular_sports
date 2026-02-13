import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartItem } from '../types';
import { createOrder } from '../services/orders';
import { sendAdminOrderNotification } from '../services/email';
// import { sendOrderConfirmation } from '../services/email';
import { validateFormData, ValidationSchema } from '../utils/inputValidation';
import { WHATSAPP_NUMBER } from '../data/constants';

interface CheckoutViewProps {
    cart: CartItem[];
    total: number;
    onPlaceOrder: (orderDetails: any) => void;
}

export const CheckoutView: FC<CheckoutViewProps> = ({ cart, total, onPlaceOrder }) => {
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        paymentMethod: 'full'
    });
    const [formError, setFormError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Validation schema for checkout form (OWASP best practices)
    const checkoutSchema: ValidationSchema = {
        firstName: {
            required: true,
            type: 'name',
            minLength: 2,
            maxLength: 50,
        },
        lastName: {
            required: false,
            type: 'name',
            minLength: 1,
            maxLength: 50,
        },
        email: {
            required: false,
            type: 'email',
            maxLength: 254,
        },
        phone: {
            required: true,
            type: 'phone',
            minLength: 10,
            maxLength: 15,
        },
        address: {
            required: true,
            type: 'address',
            minLength: 10,
            maxLength: 500,
        },
        city: {
            required: true,
            type: 'string',
            minLength: 2,
            maxLength: 100,
        },
        state: {
            required: true,
            type: 'string',
            minLength: 2,
            maxLength: 100,
        },
        zip: {
            required: true,
            type: 'zip',
            maxLength: 6,
        },
        paymentMethod: {
            required: true,
            type: 'string',
        },
    };



    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // Clear field error when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }

        setFormData({
            ...formData,
            [name]: value
        });
    };

    const openWhatsAppOrder = (orderId: string, sanitizedData: typeof formData) => {
        const totalQty = cart.reduce((acc, item) => acc + item.quantity, 0);
        const bookingAmount = totalQty * 300;
        const balance = total - bookingAmount;
        const isCOD = sanitizedData.paymentMethod === 'cod';

        // Construct WhatsApp message
        const itemsList = cart.map((item, idx) =>
            `${idx + 1}. ${item.name} (${item.size || 'N/A'}) x${item.quantity} - ₹${(item.price * item.quantity).toLocaleString('en-IN')}`
        ).join('%0A');

        let paymentDetail = '';
        if (isCOD) {
            paymentDetail = `*Payment Method:* Cash on Delivery (COD)%0A` +
                `*Booking Amount (Pre-paid):* ₹${bookingAmount.toLocaleString('en-IN')} (₹300/bat)%0A` +
                `*Balance at Delivery:* ₹${balance.toLocaleString('en-IN')}`;
        } else {
            paymentDetail = `*Payment Method:* Full Payment (Pre-paid)%0A` +
                `*Total Amount:* ₹${total.toLocaleString('en-IN')}`;
        }

        const message = `*New Order Request (${isCOD ? 'COD' : 'Full Payment'})! 🏏*%0A%0A` +
            `*Order ID:* ${orderId}%0A` +
            `*Customer:* ${sanitizedData.firstName} ${sanitizedData.lastName || ''}%0A` +
            `*Phone:* ${sanitizedData.phone}%0A` +
            `*Address:* ${sanitizedData.address}, ${sanitizedData.city}, ${sanitizedData.state} - ${sanitizedData.zip}%0A%0A` +
            `*Items:*%0A${itemsList}%0A%0A` +
            `${paymentDetail}%0A%0A` +
            `Please share payment details to confirm my order!`;

        // Open WhatsApp
        const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
        window.open(whatsappUrl, '_blank');
    };

    // Helper to create order with timeout so it doesn't hang forever


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Strict input validation & sanitization (OWASP best practices)
        const validation = validateFormData(formData, checkoutSchema);

        if (!validation.valid) {
            setFieldErrors(validation.errors);
            setFormError("Please correct the errors in the form.");
            return;
        }

        // Use sanitized data
        const sanitizedData = validation.sanitized! as typeof formData;
        setFormError('');
        setFieldErrors({});
        setIsProcessing(true);

        try {
            // SECURITY: Authenticate user before creating order
            const { ensureAuthenticated } = await import('../services/auth');
            const userId = await ensureAuthenticated();

            // Generate order ID
            const orderId = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();

            // Open WhatsApp immediately - both flows now use WhatsApp
            openWhatsAppOrder(orderId, sanitizedData);

            // Execute background save to DB with userId
            const orderData = {
                userId: userId, // REQUIRED: Links order to authenticated user
                customerName: `${sanitizedData.firstName} ${sanitizedData.lastName || ''}`.trim(),
                customerEmail: sanitizedData.email || '',
                customerPhone: sanitizedData.phone,
                customerAddress: {
                    street: sanitizedData.address,
                    city: sanitizedData.city,
                    state: sanitizedData.state,
                    pincode: sanitizedData.zip
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
                paymentMethod: sanitizedData.paymentMethod as any
            };

            // Non-blocking background save & notification
            createOrder(orderData)
                .then(() => sendAdminOrderNotification({ ...orderData, id: orderId }))
                .catch(err => console.error("Background order processing failed:", err));

            // Complete the flow immediately for the user
            onPlaceOrder({
                id: orderId,
                items: cart,
                total: total,
                shipping: sanitizedData,
                paymentMethod: sanitizedData.paymentMethod,
                orderDate: new Date().toISOString()
            });

            setIsProcessing(false);

        } catch (error: any) {
            console.error("Order process failed:", error);

            // Better error handling for auth failures
            if (error.message?.includes('authenticate')) {
                setFormError('Unable to process order. Please refresh the page and try again.');
            } else {
                setFormError(`Something went wrong. Please contact us on WhatsApp.`);
            }
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
                    <div className="alert-error" role="alert" aria-live="assertive" style={{
                        backgroundColor: '#d32f2f',
                        color: 'white',
                        padding: '1rem',
                        borderRadius: '5px',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <i className="fas fa-exclamation-circle"></i>
                        <strong>{formError}</strong>
                        <button
                            onClick={() => setFormError('')}
                            style={{
                                marginLeft: 'auto',
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '1.2rem'
                            }}
                            aria-label="Close error"
                        >
                            ×
                        </button>
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
                                        className={fieldErrors.firstName ? 'error' : ''}
                                    />
                                    {fieldErrors.firstName && (
                                        <span className="error-message">{fieldErrors.firstName}</span>
                                    )}
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
                                        className={fieldErrors.lastName ? 'error' : ''}
                                    />
                                    {fieldErrors.lastName && (
                                        <span className="error-message">{fieldErrors.lastName}</span>
                                    )}
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
                                    className={fieldErrors.phone ? 'error' : ''}
                                />
                                {fieldErrors.phone && (
                                    <span className="error-message">{fieldErrors.phone}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    disabled={isProcessing}
                                    className={fieldErrors.email ? 'error' : ''}
                                />
                                {fieldErrors.email && (
                                    <span className="error-message">{fieldErrors.email}</span>
                                )}
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
                                    className={fieldErrors.address ? 'error' : ''}
                                />
                                {fieldErrors.address && (
                                    <span className="error-message">{fieldErrors.address}</span>
                                )}
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
                                        className={fieldErrors.city ? 'error' : ''}
                                    />
                                    {fieldErrors.city && (
                                        <span className="error-message">{fieldErrors.city}</span>
                                    )}
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
                                        className={fieldErrors.state ? 'error' : ''}
                                    />
                                    {fieldErrors.state && (
                                        <span className="error-message">{fieldErrors.state}</span>
                                    )}
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
                                        maxLength={6}
                                        className={fieldErrors.zip ? 'error' : ''}
                                    />
                                    {fieldErrors.zip && (
                                        <span className="error-message">{fieldErrors.zip}</span>
                                    )}
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
                                <label className={`payment-option ${formData.paymentMethod === 'full' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="full"
                                        checked={formData.paymentMethod === 'full'}
                                        onChange={handleInputChange}
                                        disabled={isProcessing}
                                    />
                                    <div className="payment-option-content">
                                        <span><i className="fas fa-check-circle"></i> Full Payment (via WhatsApp)</span>
                                        <small>Fastest processing & priority delivery</small>
                                    </div>
                                </label>
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
                                        <span><i className="fas fa-money-bill-wave"></i> Cash on Delivery (via WhatsApp)</span>
                                        <small>Pay ₹300 per bat now to confirm</small>
                                    </div>
                                </label>
                            </div>

                            <div className="payment-security-note">
                                <i className="fas fa-info-circle"></i>
                                {formData.paymentMethod === 'cod' ? (
                                    <p>
                                        To confirm your COD order, a booking amount of
                                        <strong> ₹{(cart.reduce((acc, item) => acc + item.quantity, 0) * 300).toLocaleString('en-IN')}</strong>
                                        ({cart.reduce((acc, item) => acc + item.quantity, 0)} bat(s) × ₹300) is required.
                                        The balance <strong> ₹{(total - cart.reduce((acc, item) => acc + item.quantity, 0) * 300).toLocaleString('en-IN')}</strong> will be paid at delivery.
                                    </p>
                                ) : (
                                    <p>You will be redirected to WhatsApp to confirm your order and pay the full amount of <strong>₹{total.toLocaleString('en-IN')}</strong> securely. No extra fees!</p>
                                )}
                            </div>
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
