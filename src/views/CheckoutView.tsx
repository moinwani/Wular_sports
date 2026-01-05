import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartItem } from '../types';
import { useRazorpay } from '../hooks/useRazorpay';
import { createOrder, updateOrderStatus, updatePaymentStatus } from '../services/orders';
import { sendOrderConfirmation } from '../services/email';
import { createRazorpayOrder, verifyPayment } from '../services/razorpay';
import { validateFormData, ValidationSchema } from '../utils/inputValidation';

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
        // Load Razorpay script on mount
        loadRazorpay().then((loaded) => {
            if (loaded) {
                console.log('✅ Razorpay ready for payments');
            } else {
                console.warn('⚠️ Razorpay script failed to load');
            }
        });
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

    const handlePayment = async (orderId: string, orderDetails: any, sanitizedFormData?: typeof formData) => {
        // Check if Razorpay script is loaded
        if (!isLoaded) {
            console.error('Razorpay script not loaded, attempting to load...');
            const loaded = await loadRazorpay();
            if (!loaded) {
                setFormError('Payment gateway failed to load. Please refresh the page and try again.');
                setIsProcessing(false);
                return;
            }
        }

        // Verify Razorpay is available on window
        if (!window.Razorpay) {
            console.error('Razorpay not available on window object');
            setFormError('Payment gateway not available. Please refresh the page and try again.');
            setIsProcessing(false);
            return;
        }

        // Check if Razorpay Key ID is configured
        const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
        if (!razorpayKeyId) {
            console.error('Razorpay Key ID not configured');
            setFormError('Payment gateway not configured. Please contact support.');
            setIsProcessing(false);
            return;
        }

        // Use sanitized data if provided, otherwise re-validate
        let safeFormData = sanitizedFormData || formData;
        if (!sanitizedFormData) {
            const validation = validateFormData(formData, checkoutSchema);
            if (!validation.valid || !validation.sanitized) {
                setFormError('Invalid form data. Please refresh and try again.');
                setIsProcessing(false);
                return;
            }
            safeFormData = validation.sanitized;
        }

        try {
            console.log('Creating Razorpay order for amount:', total);
            
            // Step 1: Create Razorpay order on backend (SECURE)
            const razorpayOrder = await createRazorpayOrder({
                amount: total,
                currency: 'INR',
                receipt: orderId,
                notes: {
                    order_id: orderId,
                    customer_name: `${safeFormData.firstName} ${safeFormData.lastName || ''}`.trim(),
                    customer_email: safeFormData.email || '',
                    customer_phone: safeFormData.phone,
                    address: `${safeFormData.address}, ${safeFormData.city}, ${safeFormData.state} - ${safeFormData.zip}`
                }
            });

            console.log('Razorpay order created:', razorpayOrder);

            // Step 2: Open Razorpay checkout with order ID from backend
            console.log('Opening Razorpay checkout with order ID:', razorpayOrder.id);
            
            const options = {
                key: razorpayKeyId,
                amount: razorpayOrder.amount, // Amount from backend (already in paise)
                currency: razorpayOrder.currency,
                name: "Wular Sports",
                description: `Order #${orderDetails.orderNumber || orderId}`,
                image: "https://res.cloudinary.com/ddahm5ebv/image/upload/v1752992278/6334704126398678409-removebg-preview_dvxsud.png",
                order_id: razorpayOrder.id, // Order ID from backend (SECURE)
                handler: async function (response: any) {
                    console.log('Payment successful, response:', response);
                    try {
                        // Step 3: Verify payment signature on backend (SECURE)
                        const verification = await verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        if (!verification.success) {
                            setFormError('Payment verification failed. Please contact support.');
                            setIsProcessing(false);
                            return;
                        }

                        // Step 4: Payment verified - Update order in database
                        await updatePaymentStatus(orderId, 'completed', response.razorpay_payment_id);
                        await updateOrderStatus(orderId, 'confirmed');

                        // Step 5: Send email confirmation
                        await sendOrderConfirmation(orderDetails);

                        // Step 6: Redirect to success page
                        onPlaceOrder({
                            id: orderId,
                            items: cart,
                            total: calculateTotal(),
                            shipping: formData,
                            paymentMethod: 'online',
                            paymentId: response.razorpay_payment_id,
                            razorpayOrderId: response.razorpay_order_id,
                            orderDate: new Date().toISOString()
                        });
                    } catch (error) {
                        console.error("Error processing payment:", error);
                        setFormError("Payment successful but failed to verify. Please contact support with payment ID.");
                    } finally {
                        setIsProcessing(false);
                    }
                },
                prefill: {
                    name: `${safeFormData.firstName} ${safeFormData.lastName || ''}`.trim(),
                    email: safeFormData.email || '',
                    contact: safeFormData.phone
                },
                notes: {
                    order_id: orderId,
                    address: `${safeFormData.address}, ${safeFormData.city}, ${safeFormData.state} - ${safeFormData.zip}`
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
                setFormError(`Payment failed: ${response.error?.description || 'Please try again'}`);
                setIsProcessing(false);
            });

            // Open Razorpay checkout
            console.log('Attempting to open Razorpay checkout modal...');
            try {
                rzp1.open();
                console.log('Razorpay checkout modal opened successfully');
            } catch (openError: any) {
                console.error('Error opening Razorpay checkout:', openError);
                setFormError(`Failed to open payment gateway: ${openError?.message || 'Unknown error'}`);
                setIsProcessing(false);
            }
        } catch (error: any) {
            console.error("Error in payment flow:", error);
            
            // Provide user-friendly error messages
            let errorMessage = 'Failed to initialize payment. Please try again.';
            
            if (error.message) {
                if (error.message.includes('Failed to create order')) {
                    errorMessage = 'Failed to create payment order. Please check your connection and try again.';
                } else if (error.message.includes('Network')) {
                    errorMessage = 'Network error. Please check your internet connection and try again.';
                } else if (error.message.includes('429')) {
                    errorMessage = 'Too many requests. Please wait a moment and try again.';
                } else {
                    errorMessage = error.message;
                }
            }
            
            setFormError(errorMessage);
            setIsProcessing(false);
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
        const sanitizedData = validation.sanitized!;
        setFormError('');
        setFieldErrors({});
        setIsProcessing(true);

        try {
            // 1. Create Order in Firebase (using sanitized data)
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
                paymentMethod: sanitizedData.paymentMethod as 'cod' | 'online'
            };

            const orderId = await createOrder(orderData);

            // Prepare order object for email (combining ID with data)
            const fullOrderDetails = {
                id: orderId,
                ...orderData
            };

            if (sanitizedData.paymentMethod === 'cod') {
                // Send email confirmation
                await sendOrderConfirmation(fullOrderDetails);

                // For COD, we are done
                onPlaceOrder({
                    id: orderId,
                    items: cart,
                    total: calculateTotal(),
                    shipping: sanitizedData,
                    paymentMethod: 'cod',
                    orderDate: new Date().toISOString()
                });
                setIsProcessing(false);
            } else {
                // For Online Payment, trigger Razorpay (pass sanitized data)
                await handlePayment(orderId, fullOrderDetails, sanitizedData);
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
