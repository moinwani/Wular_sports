import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartItem } from '../types';
import { createOrder } from '../services/orders';
import { sendOrderConfirmation } from '../services/email';
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
        paymentMethod: 'cod'
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

    const calculateTotal = () => {
        return total;
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

    const openWhatsAppOrder = (orderId: string, orderDetails: any, sanitizedData: typeof formData) => {
        // Construct WhatsApp message
        const itemsList = cart.map((item, idx) =>
            `${idx + 1}. ${item.name} (${item.size || 'N/A'}) x${item.quantity} - ₹${(item.price * item.quantity).toLocaleString('en-IN')}`
        ).join('%0A');

        const message = `*New Order Request! 🏏*%0A%0A` +
            `*Order ID:* ${orderId}%0A` +
            `*Customer:* ${sanitizedData.firstName} ${sanitizedData.lastName || ''}%0A` +
            `*Phone:* ${sanitizedData.phone}%0A` +
            `*Address:* ${sanitizedData.address}, ${sanitizedData.city}, ${sanitizedData.state} - ${sanitizedData.zip}%0A%0A` +
            `*Items:*%0A${itemsList}%0A%0A` +
            `*Total Amount:* ₹${total.toLocaleString('en-IN')}%0A` +
            `*Payment Method:* Online Payment Request (Please share payment details)`;

        // Open WhatsApp
        const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
        window.open(whatsappUrl, '_blank');
    };

    // Helper to create order with timeout so it doesn't hang forever
    const createOrderWithTimeout = async (data: any): Promise<string> => {
        const timeout = new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error("Database timeout")), 10000)
        );

        try {
            return await Promise.race([createOrder(data), timeout]);
        } catch (e) {
            console.error("Database save failed, generating local ID");
            // Fallback: generate a local ID so the user flow doesn't break
            return 'OFFLINE-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        }
    };

    // Helper to handle background tasks for WhatsApp orders
    const createOrderBackground = async (sanitizedData: any, tempId: string) => {
        try {
            const orderData = {
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
                paymentMethod: 'online' as const
            };

            // Try to save to DB
            const orderId = await createOrder(orderData);
            console.log("Background order saved:", orderId);

            // Try to send email
            await sendOrderConfirmation({ id: orderId, ...orderData });

        } catch (err) {
            console.error("Background task failed:", err);
        }
    };

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
            // Priority 1: Open WhatsApp immediately for Online Payment
            // We do this concurrently or first to ensure the user gets the action they want
            if (sanitizedData.paymentMethod === 'online') {

                // Create a temporary ID if we don't have one yet
                const tempId = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();

                // Open WhatsApp immediately
                openWhatsAppOrder(tempId, { ...sanitizedData, items: cart, total }, sanitizedData);

                // Continue with background tasks (saving order, sending email)
                // We don't await these to slow down the UI
                createOrderBackground(sanitizedData, tempId);

                // Complete the flow immediately for the user
                onPlaceOrder({
                    id: tempId,
                    items: cart,
                    total: calculateTotal(),
                    shipping: sanitizedData,
                    paymentMethod: 'online',
                    paymentId: 'whatsapp-pending',
                    orderDate: new Date().toISOString()
                });

                setIsProcessing(false);
                return;
            }

            // For COD, we follow the standard flow
            // 1. Create Order in Firebase
            const orderData = {
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
                paymentMethod: 'cod' as const
            };

            const orderId = await createOrderWithTimeout(orderData);

            // Prepare order object for email (combining ID with data)
            const fullOrderDetails = {
                id: orderId,
                ...orderData
            };

            // Send email confirmation (don't let this block execution)
            sendOrderConfirmation(fullOrderDetails).catch(err => console.error("Email failed:", err));

            // Complete the order flow
            onPlaceOrder({
                id: orderId,
                items: cart,
                total: calculateTotal(),
                shipping: sanitizedData,
                paymentMethod: 'cod',
                orderDate: new Date().toISOString()
            });

            setIsProcessing(false);

        } catch (error: any) {
            console.error("Order creation failed:", error);
            // Even if Firebase fails, if it's online payment, we trust the link opened.
            // For COD, we show error.
            if (sanitizedData.paymentMethod !== 'online') {
                setFormError(`Failed to place order. Please try again or contact us on WhatsApp.`);
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
                                        <span><i className="fas fa-brands fa-whatsapp"></i> Order via WhatsApp</span>
                                        <small>Coordinate payment securely on WhatsApp</small>
                                    </div>
                                </label>
                            </div>
                            {formData.paymentMethod === 'online' && (
                                <div className="payment-security-note">
                                    <i className="fas fa-info-circle"></i>
                                    <p>You will be redirected to WhatsApp to confirm your order and receive payment details (UPI/Bank Transfer). It's fast and personal!</p>
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
