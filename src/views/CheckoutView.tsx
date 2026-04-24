import { FC, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { CartItem } from '../types';
import { createOrder } from '../services/orders';
import { sendAdminOrderNotification, sendOrderConfirmation } from '../services/email';
import { validateFormData, ValidationSchema } from '../utils/inputValidation';
import { WHATSAPP_NUMBER } from '../data/constants';
import { SEOHead } from '../components/common/SEOHead';

const COD_BOOKING_PER_BAT = 500;
const COD_FEE_PERCENT = 0.05;

function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
        if ((window as any).Razorpay) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

interface CheckoutViewProps {
    cart: CartItem[];
    total: number;
    onPlaceOrder: (orderDetails: any) => void;
}

export const CheckoutView: FC<CheckoutViewProps> = ({ cart, total, onPlaceOrder }) => {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

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
    const [pendingWhatsApp, setPendingWhatsApp] = useState<{ whatsappUrl: string } | null>(null);
    const [whatsAppReminderVisible, setWhatsAppReminderVisible] = useState(false);
    const whatsAppUrlRef = useRef<string>('');

    // When WhatsApp is open and the user returns to this tab, remind them to send the message
    useEffect(() => {
        if (!pendingWhatsApp) return;
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                setWhatsAppReminderVisible(true);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [pendingWhatsApp]);

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

    const buildWhatsAppUrl = (orderId: string, sanitizedData: typeof formData): string => {
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

        return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    };

    const openRazorpay = (
        razorpayOrderId: string,
        amountPaise: number,
        description: string,
        sanitizedData: typeof formData,
        onSuccess: (paymentId: string) => void
    ) => {
        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: amountPaise,
            currency: 'INR',
            name: 'Wular Sports',
            description,
            order_id: razorpayOrderId,
            handler: (response: { razorpay_payment_id: string }) => {
                onSuccess(response.razorpay_payment_id);
            },
            prefill: {
                name: `${sanitizedData.firstName} ${sanitizedData.lastName || ''}`.trim(),
                contact: sanitizedData.phone,
                email: sanitizedData.email || '',
            },
            theme: { color: '#C9A84C' },
            modal: {
                ondismiss: () => {
                    setIsProcessing(false);
                    setFormError('Payment cancelled. Please try again to complete your order.');
                }
            }
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validation = validateFormData(formData, checkoutSchema);
        if (!validation.valid) {
            setFieldErrors(validation.errors);
            setFormError("Please correct the errors in the form.");
            return;
        }

        const sanitizedData = validation.sanitized! as typeof formData;
        setFormError('');
        setFieldErrors({});
        setIsProcessing(true);

        try {
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                setFormError('Payment gateway failed to load. Please check your connection and try again.');
                setIsProcessing(false);
                return;
            }

            const { ensureAuthenticated } = await import('../services/auth');
            const userId = await ensureAuthenticated();
            const orderId = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
            const totalBats = cart.reduce((acc, item) => acc + item.quantity, 0);
            const isCOD = sanitizedData.paymentMethod === 'cod';

            // Amount to charge via Razorpay
            const chargeAmount = isCOD
                ? totalBats * COD_BOOKING_PER_BAT   // ₹500 per bat booking
                : total;                              // full amount

            // Create Razorpay order on server
            const res = await fetch('/api/create-razorpay-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: chargeAmount * 100, // paise
                    receipt: orderId,
                    notes: { orderId, customerPhone: sanitizedData.phone }
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to initiate payment');
            }

            const { orderId: razorpayOrderId } = await res.json();
            const description = isCOD
                ? `COD Booking — ₹${COD_BOOKING_PER_BAT} × ${totalBats} bat(s)`
                : `Full Payment — Wular Sports Order`;

            openRazorpay(razorpayOrderId, chargeAmount * 100, description, sanitizedData, async (paymentId) => {
                // Payment successful — save order
                const remaining = total - totalBats * COD_BOOKING_PER_BAT;
                const codFee = isCOD ? Math.round(remaining * COD_FEE_PERCENT) : 0;

                const orderData = {
                    userId,
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
                    total,
                    codFee,
                    razorpayPaymentId: paymentId,
                    status: 'confirmed' as const,
                    paymentStatus: isCOD ? 'pending' as const : 'completed' as const,
                    paymentMethod: sanitizedData.paymentMethod as any
                };

                createOrder(orderData)
                    .then(() => Promise.all([
                        sendAdminOrderNotification({ ...orderData, id: orderId }),
                        sendOrderConfirmation({ ...orderData, id: orderId })
                    ]))
                    .catch(err => console.error('Background order processing failed:', err));

                if (isCOD) {
                    // For COD: open WhatsApp to confirm delivery details
                    const whatsappUrl = buildWhatsAppUrl(orderId, sanitizedData);
                    whatsAppUrlRef.current = whatsappUrl;
                    window.open(whatsappUrl, '_blank');
                    setPendingWhatsApp({ whatsappUrl });
                    setIsProcessing(false);
                } else {
                    // Full payment: go straight to success
                    onPlaceOrder({ id: orderId, items: cart, total, paymentId });
                }
            });

        } catch (error: any) {
            console.error('Order process failed:', error);
            setFormError(error.message?.includes('authenticate')
                ? 'Unable to process order. Please refresh the page and try again.'
                : 'Something went wrong. Please try again or contact us on WhatsApp.'
            );
            setIsProcessing(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="container checkout-empty">
                <h2>Your cart is empty</h2>
                <button className="btn" onClick={() => router.push('/')}>Continue Shopping</button>
            </div>
        );
    }

    // WhatsApp confirmation step — shown after order is submitted and WhatsApp is opened
    if (pendingWhatsApp) {
        return (
            <div className="checkout-page">
                <div className="container">
                    <div className="whatsapp-confirm-step">
                        <div className="whatsapp-confirm-icon">
                            <i className="fab fa-whatsapp"></i>
                        </div>
                        <h2>Almost done — send the WhatsApp message!</h2>
                        <p>We've opened WhatsApp with your order details pre-filled. <strong>Please tap Send</strong> to confirm your order with us.</p>

                        {whatsAppReminderVisible && (
                            <div className="whatsapp-reminder-banner">
                                <i className="fas fa-exclamation-circle"></i> Looks like you came back without sending — your order isn't confirmed yet!
                            </div>
                        )}

                        <div className="whatsapp-confirm-actions">
                            <a
                                href={pendingWhatsApp.whatsappUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="btn whatsapp-retry-btn"
                                onClick={() => setWhatsAppReminderVisible(false)}
                            >
                                <i className="fab fa-whatsapp"></i> Open WhatsApp Again
                            </a>
                            <button
                                className="btn btn-confirm-sent"
                                onClick={() => onPlaceOrder({} as any)}
                            >
                                <i className="fas fa-check-circle"></i> I've Sent the Message
                            </button>
                        </div>
                        <p className="whatsapp-confirm-note">Once we receive your message, we'll process and ship your order within 24 hours.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <SEOHead
                title="Checkout | Wular Sports — Kashmiri Willow Cricket Bats"
                description="Complete your order for premium Kashmiri willow cricket bats from Wular Sports. Free delivery across India. Secure checkout via WhatsApp."
                canonicalUrl="https://wularsports.com/checkout"
            />
            <div className="container">
                <div className="checkout-header-mobile">
                    <button className="back-btn-simple" onClick={() => router.back()}>
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <h1 className="page-title">Checkout</h1>
                </div>

                {/* Mobile Order Summary (Collapsible) */}
                <div className={`checkout-summary-mobile ${isSummaryExpanded ? 'expanded' : ''}`}>
                    <button
                        className="summary-toggle"
                        onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                        aria-expanded={isSummaryExpanded}
                    >
                        <div className="toggle-left">
                            <i className="fas fa-shopping-cart"></i>
                            <span>{isSummaryExpanded ? 'Hide' : 'Show'} Order Summary</span>
                            <i className={`fas fa-chevron-${isSummaryExpanded ? 'up' : 'down'}`}></i>
                        </div>
                        <span className="toggle-total">₹{total.toLocaleString('en-IN')}</span>
                    </button>

                    <div className="summary-collapsible-content">
                        <div className="summary-items-mini">
                            {cart.map((item, idx) => (
                                <div key={idx} className="summary-item-mini">
                                    <span className="item-name-mini">{item.name} {item.size ? `(${item.size})` : ''} x{item.quantity}</span>
                                    <span className="item-price-mini">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                                </div>
                            ))}
                        </div>
                        <div className="summary-row-mini">
                            <span>Shipping</span>
                            <span>Free</span>
                        </div>
                    </div>
                </div>
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
                        <h2 className="section-title-compact">Shipping Information</h2>
                        <form id="checkout-form" onSubmit={handleSubmit}>
                            <div className="form-row compact">
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
                                        placeholder="First Name"
                                    />
                                    {fieldErrors.firstName && (
                                        <span className="error-message">{fieldErrors.firstName}</span>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>Last Name</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        disabled={isProcessing}
                                        className={fieldErrors.lastName ? 'error' : ''}
                                        placeholder="Last Name"
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

                            <div className="form-row compact-triple">
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
                                        placeholder="City"
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
                                        placeholder="State"
                                    />
                                    {fieldErrors.state && (
                                        <span className="error-message">{fieldErrors.state}</span>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>ZIP *</label>
                                    <input
                                        type="text"
                                        name="zip"
                                        value={formData.zip}
                                        onChange={handleInputChange}
                                        required
                                        disabled={isProcessing}
                                        maxLength={6}
                                        className={fieldErrors.zip ? 'error' : ''}
                                        placeholder="ZIP"
                                    />
                                    {fieldErrors.zip && (
                                        <span className="error-message">{fieldErrors.zip}</span>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Right Column: Order Summary & Payment */}
                    <div className="checkout-summary-section">
                        <div className="desktop-only">
                            <h2 className="section-title-compact">Order Summary</h2>
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

                            {/* Order trust indicators */}
                            <div className="secure-payment-badges">
                                <div className="secure-badge">
                                    <i className="fas fa-shipping-fast"></i>
                                    <span>Free Delivery</span>
                                </div>
                                <div className="secure-badge">
                                    <i className="fab fa-whatsapp"></i>
                                    <span>WhatsApp Confirmed</span>
                                </div>
                                <div className="secure-badge">
                                    <i className="fas fa-undo-alt"></i>
                                    <span>Easy Returns</span>
                                </div>
                            </div>
                        </div>

                        <div className="payment-section">
                            <h3>Payment Method</h3>

                            {(() => {
                                const totalBats = cart.reduce((acc, item) => acc + item.quantity, 0);
                                const booking = totalBats * COD_BOOKING_PER_BAT;
                                const remaining = total - booking;
                                const codFee = Math.round(remaining * COD_FEE_PERCENT);
                                const totalAtDoor = remaining + codFee;

                                return (
                                    <>
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
                                                    <span><i className="fas fa-lock"></i> Full Payment</span>
                                                    <small>Pay securely now — no extra charges</small>
                                                    <span className="payment-save-badge">Save ₹{codFee.toLocaleString('en-IN')} vs COD</span>
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
                                                    <span><i className="fas fa-money-bill-wave"></i> Cash on Delivery</span>
                                                    <small>Pay ₹{COD_BOOKING_PER_BAT}/bat now + balance at door</small>
                                                </div>
                                            </label>
                                        </div>

                                        {formData.paymentMethod === 'cod' ? (
                                            <div className="cod-breakdown">
                                                <div className="cod-row">
                                                    <span>Order total</span>
                                                    <span>₹{total.toLocaleString('en-IN')}</span>
                                                </div>
                                                <div className="cod-row">
                                                    <span>Booking amount <em>(paid now via Razorpay)</em></span>
                                                    <span className="cod-booking">− ₹{booking.toLocaleString('en-IN')}</span>
                                                </div>
                                                <div className="cod-row">
                                                    <span>Remaining at delivery</span>
                                                    <span>₹{remaining.toLocaleString('en-IN')}</span>
                                                </div>
                                                <div className="cod-row cod-fee-row">
                                                    <span>
                                                        COD convenience fee (5%)
                                                        <span className="cod-fee-note"> — charged by India Post / D2DC, not by Wular Sports</span>
                                                    </span>
                                                    <span className="cod-fee">+ ₹{codFee.toLocaleString('en-IN')}</span>
                                                </div>
                                                <div className="cod-row cod-total-door">
                                                    <span><strong>Amount due at delivery</strong></span>
                                                    <span><strong>₹{totalAtDoor.toLocaleString('en-IN')}</strong></span>
                                                </div>
                                                <p className="cod-save-hint">
                                                    <i className="fas fa-lightbulb"></i> Choose <strong>Full Payment</strong> and save ₹{codFee.toLocaleString('en-IN')} in COD charges.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="full-payment-note">
                                                <i className="fas fa-check-circle"></i>
                                                <p>Pay ₹{total.toLocaleString('en-IN')} securely via Razorpay now. <strong>No COD charges apply.</strong> You save ₹{codFee.toLocaleString('en-IN')} compared to Cash on Delivery.</p>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
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
