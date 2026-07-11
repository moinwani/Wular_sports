import { FC, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { CartItem } from '../types';
import { createOrder } from '../services/orders';
import { sendAdminOrderNotification, sendOrderConfirmation } from '../services/email';
import { validateFormData, ValidationSchema } from '../utils/inputValidation';
import { WHATSAPP_NUMBER } from '../data/constants';
import { SEOHead } from '../components/common/SEOHead';
import { Icon } from '../components/common/Icon';
import { CheckoutAuth } from '../components/checkout/CheckoutAuth';
import { useCart } from '../context/CartContext';

const hashData = async (value: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(value.trim().toLowerCase());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
};

const COUNTRY_CODES = [
    { code: '+91', country: 'India' },
    { code: '+93', country: 'Afghanistan' },
    { code: '+355', country: 'Albania' },
    { code: '+213', country: 'Algeria' },
    { code: '+376', country: 'Andorra' },
    { code: '+244', country: 'Angola' },
    { code: '+54', country: 'Argentina' },
    { code: '+374', country: 'Armenia' },
    { code: '+61', country: 'Australia' },
    { code: '+43', country: 'Austria' },
    { code: '+994', country: 'Azerbaijan' },
    { code: '+973', country: 'Bahrain' },
    { code: '+880', country: 'Bangladesh' },
    { code: '+375', country: 'Belarus' },
    { code: '+32', country: 'Belgium' },
    { code: '+501', country: 'Belize' },
    { code: '+229', country: 'Benin' },
    { code: '+975', country: 'Bhutan' },
    { code: '+591', country: 'Bolivia' },
    { code: '+387', country: 'Bosnia & Herzegovina' },
    { code: '+267', country: 'Botswana' },
    { code: '+55', country: 'Brazil' },
    { code: '+673', country: 'Brunei' },
    { code: '+359', country: 'Bulgaria' },
    { code: '+226', country: 'Burkina Faso' },
    { code: '+257', country: 'Burundi' },
    { code: '+855', country: 'Cambodia' },
    { code: '+237', country: 'Cameroon' },
    { code: '+1', country: 'Canada' },
    { code: '+238', country: 'Cape Verde' },
    { code: '+236', country: 'Central African Republic' },
    { code: '+235', country: 'Chad' },
    { code: '+56', country: 'Chile' },
    { code: '+86', country: 'China' },
    { code: '+57', country: 'Colombia' },
    { code: '+242', country: 'Congo' },
    { code: '+506', country: 'Costa Rica' },
    { code: '+385', country: 'Croatia' },
    { code: '+53', country: 'Cuba' },
    { code: '+357', country: 'Cyprus' },
    { code: '+420', country: 'Czech Republic' },
    { code: '+243', country: 'DR Congo' },
    { code: '+45', country: 'Denmark' },
    { code: '+253', country: 'Djibouti' },
    { code: '+1-809', country: 'Dominican Republic' },
    { code: '+593', country: 'Ecuador' },
    { code: '+20', country: 'Egypt' },
    { code: '+503', country: 'El Salvador' },
    { code: '+291', country: 'Eritrea' },
    { code: '+372', country: 'Estonia' },
    { code: '+251', country: 'Ethiopia' },
    { code: '+679', country: 'Fiji' },
    { code: '+358', country: 'Finland' },
    { code: '+33', country: 'France' },
    { code: '+241', country: 'Gabon' },
    { code: '+220', country: 'Gambia' },
    { code: '+995', country: 'Georgia' },
    { code: '+49', country: 'Germany' },
    { code: '+233', country: 'Ghana' },
    { code: '+30', country: 'Greece' },
    { code: '+502', country: 'Guatemala' },
    { code: '+224', country: 'Guinea' },
    { code: '+592', country: 'Guyana' },
    { code: '+509', country: 'Haiti' },
    { code: '+504', country: 'Honduras' },
    { code: '+852', country: 'Hong Kong' },
    { code: '+36', country: 'Hungary' },
    { code: '+354', country: 'Iceland' },
    { code: '+62', country: 'Indonesia' },
    { code: '+98', country: 'Iran' },
    { code: '+964', country: 'Iraq' },
    { code: '+353', country: 'Ireland' },
    { code: '+972', country: 'Israel' },
    { code: '+39', country: 'Italy' },
    { code: '+225', country: 'Ivory Coast' },
    { code: '+1-876', country: 'Jamaica' },
    { code: '+81', country: 'Japan' },
    { code: '+962', country: 'Jordan' },
    { code: '+7', country: 'Kazakhstan' },
    { code: '+254', country: 'Kenya' },
    { code: '+965', country: 'Kuwait' },
    { code: '+996', country: 'Kyrgyzstan' },
    { code: '+856', country: 'Laos' },
    { code: '+371', country: 'Latvia' },
    { code: '+961', country: 'Lebanon' },
    { code: '+266', country: 'Lesotho' },
    { code: '+231', country: 'Liberia' },
    { code: '+218', country: 'Libya' },
    { code: '+370', country: 'Lithuania' },
    { code: '+352', country: 'Luxembourg' },
    { code: '+853', country: 'Macau' },
    { code: '+261', country: 'Madagascar' },
    { code: '+265', country: 'Malawi' },
    { code: '+60', country: 'Malaysia' },
    { code: '+960', country: 'Maldives' },
    { code: '+223', country: 'Mali' },
    { code: '+356', country: 'Malta' },
    { code: '+222', country: 'Mauritania' },
    { code: '+230', country: 'Mauritius' },
    { code: '+52', country: 'Mexico' },
    { code: '+373', country: 'Moldova' },
    { code: '+377', country: 'Monaco' },
    { code: '+976', country: 'Mongolia' },
    { code: '+382', country: 'Montenegro' },
    { code: '+212', country: 'Morocco' },
    { code: '+258', country: 'Mozambique' },
    { code: '+95', country: 'Myanmar' },
    { code: '+264', country: 'Namibia' },
    { code: '+977', country: 'Nepal' },
    { code: '+31', country: 'Netherlands' },
    { code: '+64', country: 'New Zealand' },
    { code: '+505', country: 'Nicaragua' },
    { code: '+227', country: 'Niger' },
    { code: '+234', country: 'Nigeria' },
    { code: '+850', country: 'North Korea' },
    { code: '+389', country: 'North Macedonia' },
    { code: '+47', country: 'Norway' },
    { code: '+968', country: 'Oman' },
    { code: '+92', country: 'Pakistan' },
    { code: '+970', country: 'Palestine' },
    { code: '+507', country: 'Panama' },
    { code: '+675', country: 'Papua New Guinea' },
    { code: '+595', country: 'Paraguay' },
    { code: '+51', country: 'Peru' },
    { code: '+63', country: 'Philippines' },
    { code: '+48', country: 'Poland' },
    { code: '+351', country: 'Portugal' },
    { code: '+974', country: 'Qatar' },
    { code: '+40', country: 'Romania' },
    { code: '+7', country: 'Russia' },
    { code: '+250', country: 'Rwanda' },
    { code: '+966', country: 'Saudi Arabia' },
    { code: '+221', country: 'Senegal' },
    { code: '+381', country: 'Serbia' },
    { code: '+232', country: 'Sierra Leone' },
    { code: '+65', country: 'Singapore' },
    { code: '+421', country: 'Slovakia' },
    { code: '+386', country: 'Slovenia' },
    { code: '+252', country: 'Somalia' },
    { code: '+27', country: 'South Africa' },
    { code: '+82', country: 'South Korea' },
    { code: '+211', country: 'South Sudan' },
    { code: '+34', country: 'Spain' },
    { code: '+94', country: 'Sri Lanka' },
    { code: '+249', country: 'Sudan' },
    { code: '+597', country: 'Suriname' },
    { code: '+268', country: 'Swaziland' },
    { code: '+46', country: 'Sweden' },
    { code: '+41', country: 'Switzerland' },
    { code: '+963', country: 'Syria' },
    { code: '+886', country: 'Taiwan' },
    { code: '+992', country: 'Tajikistan' },
    { code: '+255', country: 'Tanzania' },
    { code: '+66', country: 'Thailand' },
    { code: '+228', country: 'Togo' },
    { code: '+216', country: 'Tunisia' },
    { code: '+90', country: 'Turkey' },
    { code: '+993', country: 'Turkmenistan' },
    { code: '+256', country: 'Uganda' },
    { code: '+380', country: 'Ukraine' },
    { code: '+971', country: 'United Arab Emirates' },
    { code: '+44', country: 'United Kingdom' },
    { code: '+1', country: 'United States' },
    { code: '+598', country: 'Uruguay' },
    { code: '+998', country: 'Uzbekistan' },
    { code: '+58', country: 'Venezuela' },
    { code: '+84', country: 'Vietnam' },
    { code: '+967', country: 'Yemen' },
    { code: '+260', country: 'Zambia' },
    { code: '+263', country: 'Zimbabwe' },
];

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

// Phone and ZIP rules adapt to the selected country so international
// customers aren't blocked by India-only formats.
const buildCheckoutSchema = (isIndianPhone: boolean, isIndiaOrder: boolean): ValidationSchema => ({
    firstName: { required: true, type: 'name', minLength: 2, maxLength: 50 },
    lastName: { required: false, type: 'name', minLength: 1, maxLength: 50 },
    email: { required: true, type: 'email', maxLength: 254 },
    phone: isIndianPhone
        ? { required: true, type: 'phone', minLength: 10, maxLength: 10 }
        : { required: true, type: 'string', minLength: 6, maxLength: 15, pattern: /^\d{6,15}$/ },
    countryCode: { required: false, type: 'string', minLength: 1, maxLength: 7 },
    address: { required: true, type: 'address', minLength: 10, maxLength: 500 },
    city: { required: true, type: 'string', minLength: 2, maxLength: 100 },
    state: { required: true, type: 'string', minLength: 2, maxLength: 100 },
    zip: isIndiaOrder
        ? { required: true, type: 'zip', maxLength: 6 }
        : { required: true, type: 'string', minLength: 3, maxLength: 10, pattern: /^[A-Za-z0-9][A-Za-z0-9\s\-]{2,9}$/ },
    country: { required: true, type: 'string', minLength: 2, maxLength: 100 },
    paymentMethod: { required: true, type: 'string' },
});

export const CheckoutView: FC<CheckoutViewProps> = ({ cart, total, onPlaceOrder }) => {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        countryCode: '+91',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: 'India',
        paymentMethod: 'full'
    });
    const [formError, setFormError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [pendingWhatsApp, setPendingWhatsApp] = useState<{ whatsappUrl: string } | null>(null);
    const [whatsAppReminderVisible, setWhatsAppReminderVisible] = useState(false);
    const whatsAppUrlRef = useRef<string>('');
    const savedOrderIdRef = useRef<string>('');
    const submitLockRef = useRef(false);
    const [isEmailFromAuth, setIsEmailFromAuth] = useState(false);
    const [authedEmail, setAuthedEmail] = useState<string | null>(null);
    const { clearCart } = useCart();

    // Release the synchronous double-submit lock whenever processing ends
    useEffect(() => {
        if (!isProcessing) submitLockRef.current = false;
    }, [isProcessing]);

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

    // GA4 / GTM: track begin_checkout when page loads with items in cart
    useEffect(() => {
        if (!(cart.length > 0 && typeof window !== 'undefined' && window.dataLayer)) return;
        (async () => {
            const userData: Record<string, string> = {};
            try {
                const { getCurrentUser } = await import('../services/auth');
                const user = getCurrentUser();
                if (user?.email) {
                    userData.em = await hashData(user.email);
                }
            } catch { /* silent */ }

            const payload: Record<string, any> = {
                event: 'begin_checkout',
                ecommerce: {
                    currency: 'INR',
                    value: total,
                    items: cart.map(item => ({
                        item_id: item.id,
                        item_name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                    }))
                }
            };
            if (Object.keys(userData).length > 0) {
                payload.user_data = userData;
            }
            window.dataLayer.push(payload);
        })();
    }, []);

    // Live auth state — optional convenience: prefill email when signed in.
    // Guests can always type their email and check out without an account.
    const emailFromAuthRef = useRef(false);
    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        (async () => {
            try {
                const { subscribeToAuthChanges } = await import('../services/auth');
                unsubscribe = subscribeToAuthChanges((user) => {
                    if (user && user.email && !user.isAnonymous) {
                        setAuthedEmail(user.email);
                        setFormData(prev => (prev.email ? prev : { ...prev, email: user.email! }));
                        setIsEmailFromAuth(true);
                        emailFromAuthRef.current = true;
                    } else {
                        setAuthedEmail(null);
                        // Only clear the email if we auto-filled it from the account
                        if (emailFromAuthRef.current) {
                            setFormData(prev => ({ ...prev, email: '' }));
                            emailFromAuthRef.current = false;
                        }
                        setIsEmailFromAuth(false);
                    }
                });
            } catch {
                // Auth unavailable — guest checkout still works
            }
        })();
        return () => { if (unsubscribe) unsubscribe(); };
    }, []);

    const isIndiaOrder = formData.country === 'India';
    const isIndianPhone = formData.countryCode === '+91';

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

        let filteredValue = value;
        if (name === 'firstName' || name === 'lastName') {
            // Only letters, spaces, hyphens, apostrophes, and dots
            filteredValue = value.replace(/[^a-zA-Z\s\-'\.]/g, '');
        } else if (name === 'phone') {
            // Digits only — 10 for India, up to 15 internationally
            const maxDigits = formData.countryCode === '+91' ? 10 : 15;
            filteredValue = value.replace(/\D/g, '').substring(0, maxDigits);
        } else if (name === 'zip') {
            if (formData.country === 'India') {
                // Indian pincode: digits only, max 6
                filteredValue = value.replace(/\D/g, '').substring(0, 6);
            } else {
                // International postal codes can be alphanumeric
                filteredValue = value.replace(/[^A-Za-z0-9\s\-]/g, '').substring(0, 10);
            }
        }

        if (name === 'email') {
            // User is typing their own email — stop treating it as auth-sourced
            emailFromAuthRef.current = false;
        }

        setFormData(prev => {
            const next = { ...prev, [name]: filteredValue };
            // International orders cannot use COD
            if (name === 'country' && filteredValue !== 'India' && prev.paymentMethod === 'cod') {
                next.paymentMethod = 'full';
            }
            return next;
        });
    };

    const buildWhatsAppUrl = (orderId: string, sanitizedData: typeof formData): string => {
        const totalQty = cart.reduce((acc, item) => acc + item.quantity, 0);
        const bookingAmount = totalQty * COD_BOOKING_PER_BAT;
        const remaining = total - bookingAmount;
        const codFee = Math.round(remaining * COD_FEE_PERCENT);
        const balanceAtDoor = remaining + codFee;
        const isCOD = sanitizedData.paymentMethod === 'cod';

        // Construct WhatsApp message (plain \n newlines — the whole message is
        // URL-encoded at the end so &, #, + in addresses can't truncate it)
        const itemsList = cart.map((item, idx) =>
            `${idx + 1}. ${item.name} (${item.size || 'N/A'}) x${item.quantity} - ₹${(item.price * item.quantity).toLocaleString('en-IN')}`
        ).join('\n');

        let paymentDetail = '';
        if (isCOD) {
            paymentDetail = `*Payment Method:* Cash on Delivery (COD)\n` +
                `*Booking Amount (Pre-paid):* ₹${bookingAmount.toLocaleString('en-IN')} (₹${COD_BOOKING_PER_BAT}/bat)\n` +
                `*Remaining:* ₹${remaining.toLocaleString('en-IN')}\n` +
                `*COD Convenience Fee (5%):* ₹${codFee.toLocaleString('en-IN')} (charged by courier)\n` +
                `*Amount Due at Delivery:* ₹${balanceAtDoor.toLocaleString('en-IN')}`;
        } else {
            paymentDetail = `*Payment Method:* Full Payment (Pre-paid)\n` +
                `*Total Amount:* ₹${total.toLocaleString('en-IN')}`;
        }

        const isIndia = (sanitizedData.country || 'India') === 'India';
        const deliveryNote = isIndia
            ? ''
            : `\n⚠️ *International Order* — Delivery charges will be communicated via WhatsApp / email.`;

        const message = `*New Order Request (${isCOD ? 'COD' : 'Full Payment'})! 🏏*\n\n` +
            `*Order ID:* ${orderId}\n` +
            `*Customer:* ${sanitizedData.firstName} ${sanitizedData.lastName || ''}\n` +
            `*Phone:* ${sanitizedData.countryCode || '+91'}${sanitizedData.phone}\n` +
            `*Address:* ${sanitizedData.address}, ${sanitizedData.city}, ${sanitizedData.state} - ${sanitizedData.zip}, ${sanitizedData.country || 'India'}\n\n` +
            `*Items:*\n${itemsList}\n\n` +
            `${paymentDetail}${deliveryNote}\n\n` +
            `Please share payment details to confirm my order!`;

        return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    };

    const buildDeliveryInquiryUrl = (sanitizedData: typeof formData): string => {
        const itemsList = cart.map((item, idx) =>
            `${idx + 1}. ${item.name} (${item.size || 'N/A'}) x${item.quantity}`
        ).join('\n');

        const message = `*International Delivery Inquiry 🌍*\n\n` +
            `Hi Wular Sports, I'd like to know the delivery charges for shipping to my address before placing my order.\n\n` +
            `*Name:* ${sanitizedData.firstName} ${sanitizedData.lastName || ''}\n` +
            `*Email:* ${sanitizedData.email}\n` +
            `*Phone:* ${sanitizedData.countryCode || '+91'}${sanitizedData.phone}\n` +
            `*Shipping Address:*\n${sanitizedData.address}, ${sanitizedData.city}, ${sanitizedData.state} - ${sanitizedData.zip}, ${sanitizedData.country}\n\n` +
            `*Items I want to order:*\n${itemsList}\n\n` +
            `*Order Subtotal:* ₹${total.toLocaleString('en-IN')}\n\n` +
            `Please confirm the delivery charges for this address. Thank you!`;

        return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    };

    const handleDeliveryInquiry = () => {
        const validation = validateFormData(formData, buildCheckoutSchema(isIndianPhone, isIndiaOrder));
        if (!validation.valid) {
            setFieldErrors(validation.errors);
            setFormError('Please fill in all your details before checking delivery charges.');
            return;
        }
        setFormError('');
        setFieldErrors({});
        const url = buildDeliveryInquiryUrl(validation.sanitized! as typeof formData);
        window.dataLayer.push({
            event: 'whatsapp_click',
            source: 'delivery_inquiry',
            type: 'delivery_inquiry',
            total,
        });
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const openRazorpay = (
        razorpayOrderId: string,
        amountPaise: number,
        description: string,
        sanitizedData: typeof formData,
        onSuccess: (paymentId: string, rzpOrderId: string, signature: string) => void
    ) => {
        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: amountPaise,
            currency: 'INR',
            name: 'Wular Sports',
            description,
            order_id: razorpayOrderId,
            handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
                onSuccess(response.razorpay_payment_id, response.razorpay_order_id, response.razorpay_signature);
            },
            prefill: {
                name: `${sanitizedData.firstName} ${sanitizedData.lastName || ''}`.trim(),
                contact: `${sanitizedData.countryCode || '+91'}${sanitizedData.phone}`,
                email: sanitizedData.email || '',
            },
            config: {
                display: {
                    hide: [{ method: 'emi' }, { method: 'paylater' }],
                    preferences: { show_default_blocks: true }
                }
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

        const validation = validateFormData(formData, buildCheckoutSchema(isIndianPhone, isIndiaOrder));
        if (!validation.valid) {
            setFieldErrors(validation.errors);
            setFormError("Please correct the errors in the form.");
            return;
        }

        // Synchronous lock: the isProcessing state alone can't stop two submits
        // landing in the same tick (double-click / Enter + click), which would
        // open two payment modals and risk a double charge.
        if (submitLockRef.current) return;
        submitLockRef.current = true;

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

            const { ensureAuthenticated, getCurrentUser } = await import('../services/auth');
            const userId = await ensureAuthenticated();
            const user = getCurrentUser();
            const token = user ? await user.getIdToken() : '';

            const orderId = 'ORD-' + crypto.randomUUID().replace(/-/g, '').substring(0, 10).toUpperCase();
            const totalBats = cart.reduce((acc, item) => acc + item.quantity, 0);
            const isCOD = sanitizedData.paymentMethod === 'cod';

            // Create Razorpay order on server — amount is computed server-side
            const res = await fetch('/api/create-razorpay-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    items: cart.map(item => ({ id: item.id, quantity: item.quantity })),
                    paymentMethod: sanitizedData.paymentMethod,
                    receipt: orderId,
                    notes: { orderId, customerPhone: sanitizedData.phone }
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to initiate payment');
            }

            const { orderId: razorpayOrderId, chargeAmount } = await res.json();
            const description = isCOD
                ? `COD Booking — ₹${COD_BOOKING_PER_BAT} × ${totalBats} bat(s)`
                : `Full Payment — Wular Sports Order`;

            openRazorpay(razorpayOrderId, chargeAmount * 100, description, sanitizedData, async (paymentId: string, rzpOrderId: string, signature: string) => {
                // Verify payment signature server-side before processing
                try {
                    const verifyRes = await fetch('/api/verify-razorpay-payment', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            razorpay_order_id: rzpOrderId,
                            razorpay_payment_id: paymentId,
                            razorpay_signature: signature,
                        }),
                    });
                    if (!verifyRes.ok) {
                        setFormError('Payment verification failed. Please contact us on WhatsApp with your payment ID: ' + paymentId);
                        setIsProcessing(false);
                        return;
                    }
                } catch {
                    setFormError('Unable to verify payment. Please contact us on WhatsApp with your payment ID: ' + paymentId);
                    setIsProcessing(false);
                    return;
                }

                // Build order data
                const bookingAmount = isCOD ? totalBats * COD_BOOKING_PER_BAT : 0;
                const remaining = isCOD ? total - bookingAmount : 0;
                const codFee = isCOD ? Math.round(remaining * COD_FEE_PERCENT) : 0;
                const totalAtDoor = isCOD ? remaining + codFee : 0;

                // Resolve the uid at write time — auth state may have changed
                // (e.g. One Tap sign-in in another tab) while the payment
                // modal was open, and the rules require userId == auth.uid.
                const { getCurrentUser: getUserNow } = await import('../services/auth');
                const uidAtWrite = getUserNow()?.uid || userId;

                const orderData = {
                    userId: uidAtWrite,
                    customerName: `${sanitizedData.firstName} ${sanitizedData.lastName || ''}`.trim(),
                    customerEmail: sanitizedData.email || '',
                    customerPhone: `${sanitizedData.countryCode || '+91'}${sanitizedData.phone}`,
                    customerAddress: {
                        street: sanitizedData.address,
                        city: sanitizedData.city,
                        state: sanitizedData.state,
                        pincode: sanitizedData.zip,
                        country: sanitizedData.country || 'India'
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
                    bookingAmount,
                    remaining,
                    totalAtDoor,
                    razorpayPaymentId: paymentId,
                    paymentId,
                    status: 'pending' as const,
                    paymentStatus: 'pending' as const,
                    paymentMethod: sanitizedData.paymentMethod as any
                };

                // Save order to Firestore — must succeed before continuing
                let firestoreOrderId: string;
                try {
                    firestoreOrderId = await createOrder(orderData);
                } catch (err: any) {
                    console.error('Firestore save failed:', err?.code, err?.message, err);
                    setFormError('Your payment was successful but we could not save your order. Please contact us on WhatsApp with your payment ID: ' + paymentId);
                    setIsProcessing(false);
                    return;
                }

                // Send emails in background (non-blocking, best-effort)
                sendAdminOrderNotification({ ...orderData, id: firestoreOrderId })
                    .catch(err => console.error('Admin notification failed:', err));
                if (sanitizedData.email) {
                    sendOrderConfirmation({ ...orderData, id: firestoreOrderId })
                        .catch(err => console.error('Customer email failed:', err));
                }

                // GA4 / GTM / Meta CAPI: generate event_id for deduplication
                const eventId = crypto.randomUUID();

                // GA4 / GTM: track purchase with Advanced Matching
                if (typeof window !== 'undefined' && window.dataLayer) {
                    const userData: Record<string, string> = {};
                    if (sanitizedData.email) {
                        try { userData.em = await hashData(sanitizedData.email); } catch { /* silent */ }
                    }
                    if (sanitizedData.phone) {
                        try {
                            const phone = `${sanitizedData.countryCode || '+91'}${sanitizedData.phone}`.replace(/\D/g, '');
                            userData.ph = await hashData(phone);
                        } catch { /* silent */ }
                    }

                    const payload: Record<string, any> = {
                        event: 'purchase',
                        event_id: eventId,
                        ecommerce: {
                            transaction_id: firestoreOrderId,
                            value: total,
                            currency: 'INR',
                            payment_type: isCOD ? 'cod' : 'full',
                            items: cart.map(item => ({
                                item_id: item.id,
                                item_name: item.name,
                                price: item.price,
                                quantity: item.quantity,
                            }))
                        }
                    };
                    if (Object.keys(userData).length > 0) {
                        payload.user_data = userData;
                    }
                    window.dataLayer.push(payload);
                }

                // Meta CAPI: server-side purchase event (non-blocking, best-effort)
                fetch('/api/capi', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        event_id: eventId,
                        email: sanitizedData.email || '',
                        phone: `${sanitizedData.countryCode || '+91'}${sanitizedData.phone}`,
                        orderId: firestoreOrderId,
                        total,
                        items: cart.map(item => ({
                            id: item.id,
                            name: item.name,
                            price: item.price,
                            quantity: item.quantity,
                        })),
                    }),
                }).catch(err => console.error('Meta CAPI send failed:', err));

                if (isCOD) {
                    // For COD: open WhatsApp to confirm delivery details
                    window.dataLayer.push({
                        event: 'whatsapp_order_confirm',
                        source: 'checkout_cod',
                        type: 'order_confirmation',
                        order_id: firestoreOrderId,
                        total,
                    });
                    const whatsappUrl = buildWhatsAppUrl(firestoreOrderId, sanitizedData);
                    whatsAppUrlRef.current = whatsappUrl;
                    savedOrderIdRef.current = firestoreOrderId;
                    // Booking is paid and the order is saved — clear the cart now
                    // so it can't be re-submitted for a duplicate charge.
                    clearCart();
                    window.open(whatsappUrl, '_blank');
                    setPendingWhatsApp({ whatsappUrl });
                    setIsProcessing(false);
                } else {
                    // Full payment: go straight to success
                    onPlaceOrder({ id: firestoreOrderId, items: cart, total, paymentId });
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

    // WhatsApp confirmation step — shown after order is submitted and WhatsApp
    // is opened. Must be checked BEFORE the empty-cart screen because the cart
    // is cleared as soon as the COD order is saved.
    if (pendingWhatsApp) {
        return (
            <div className="checkout-page">
                <div className="container">
                    <div className="whatsapp-confirm-step">
                        <div className="whatsapp-confirm-icon">
                            <Icon name="fa-whatsapp" />
                        </div>
                        <h2>Almost done — send the WhatsApp message!</h2>
                        <p>We've opened WhatsApp with your order details pre-filled. <strong>Please tap Send</strong> to confirm your order with us.</p>

                        {whatsAppReminderVisible && (
                            <div className="whatsapp-reminder-banner">
                                <Icon name="fa-exclamation-circle" /> Looks like you came back without sending — your order isn't confirmed yet!
                            </div>
                        )}

                        <div className="whatsapp-confirm-actions">
                        <a
                            href={pendingWhatsApp.whatsappUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn whatsapp-retry-btn"
                            onClick={() => {
                                setWhatsAppReminderVisible(false);
                                window.dataLayer.push({
                                    event: 'whatsapp_retry',
                                    source: 'checkout_retry',
                                    type: 'whatsapp_retry',
                                });
                            }}
                        >
                            <Icon name="fa-whatsapp" /> Open WhatsApp Again
                        </a>
                        <button
                            className="btn btn-confirm-sent"
                            onClick={() => {
                                window.dataLayer.push({
                                    event: 'whatsapp_confirmed',
                                    source: 'checkout_confirmed',
                                    type: 'whatsapp_sent',
                                });
                                onPlaceOrder({ id: savedOrderIdRef.current });
                            }}
                        >
                            <Icon name="fa-check-circle" /> I've Sent the Message
                        </button>
                        </div>
                        <p className="whatsapp-confirm-note">Once we receive your message, we'll process and ship your order within 24 hours.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (cart.length === 0) {
        return (
            <div className="container checkout-empty">
                <h2>Your cart is empty</h2>
                <button className="btn" onClick={() => router.push('/')}>Continue Shopping</button>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <SEOHead
                title="Checkout | Wular Sports — Kashmiri Willow Cricket Bats"
                description="Complete your order for premium Kashmiri willow cricket bats from Wular Sports. Free delivery across India. Secure checkout via WhatsApp."
                canonicalUrl="https://wularsports.com/checkout"
                robots="noindex, nofollow"
            />
            <div className="container">
                <div className="checkout-header-mobile">
                    <button className="back-btn-simple" onClick={() => router.back()}>
                        <Icon name="fa-arrow-left" />
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
                            <Icon name="fa-shopping-cart" />
                            <span>{isSummaryExpanded ? 'Hide' : 'Show'} Order Summary</span>
                            <Icon name={isSummaryExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} />
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
                        <Icon name="fa-exclamation-circle" />
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

                        <CheckoutAuth authedEmail={authedEmail} disabled={isProcessing} />

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
                                        autoComplete="given-name"
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
                                        autoComplete="family-name"
                                    />
                                    {fieldErrors.lastName && (
                                        <span className="error-message">{fieldErrors.lastName}</span>
                                    )}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Phone Number *</label>
                                <div className="phone-input-group">
                                    <select
                                        name="countryCode"
                                        value={formData.countryCode}
                                        onChange={handleInputChange}
                                        disabled={isProcessing}
                                        className="country-code-select"
                                        aria-label="Country code"
                                    >
                                        {COUNTRY_CODES.map(({ code, country }) => (
                                            <option key={`${code}-${country}`} value={code}>
                                                {code} {country}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        required
                                        disabled={isProcessing}
                                        className={fieldErrors.phone ? 'error' : ''}
                                        placeholder={isIndianPhone ? '10-digit number' : 'Phone number'}
                                        maxLength={isIndianPhone ? 10 : 15}
                                        inputMode="numeric"
                                        autoComplete="tel-national"
                                    />
                                </div>
                                {fieldErrors.phone && (
                                    <span className="error-message">{fieldErrors.phone}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Email Address *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isProcessing}
                                    className={fieldErrors.email ? 'error' : ''}
                                    placeholder="your@email.com"
                                    autoComplete="email"
                                    inputMode="email"
                                />
                                {isEmailFromAuth && formData.email === authedEmail ? (
                                    <span className="field-note field-note--success">Signed-in email — order confirmation will be sent here</span>
                                ) : (
                                    <span className="field-note">Your order confirmation will be sent to this email.</span>
                                )}
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
                                    autoComplete="street-address"
                                />
                                {fieldErrors.address && (
                                    <span className="error-message">{fieldErrors.address}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Country *</label>
                                <select
                                    name="country"
                                    value={formData.country}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isProcessing}
                                    className={fieldErrors.country ? 'error' : ''}
                                >
                                    {COUNTRY_CODES.map(({ country }) => (
                                        <option key={country} value={country}>
                                            {country}
                                        </option>
                                    ))}
                                </select>
                                {fieldErrors.country && (
                                    <span className="error-message">{fieldErrors.country}</span>
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
                                        autoComplete="address-level2"
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
                                        autoComplete="address-level1"
                                    />
                                    {fieldErrors.state && (
                                        <span className="error-message">{fieldErrors.state}</span>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>{isIndiaOrder ? 'PIN Code *' : 'ZIP / Postal Code *'}</label>
                                    <input
                                        type="text"
                                        name="zip"
                                        value={formData.zip}
                                        onChange={handleInputChange}
                                        required
                                        disabled={isProcessing}
                                        maxLength={isIndiaOrder ? 6 : 10}
                                        inputMode={isIndiaOrder ? 'numeric' : 'text'}
                                        className={fieldErrors.zip ? 'error' : ''}
                                        placeholder={isIndiaOrder ? '6-digit PIN' : 'Postal code'}
                                        autoComplete="postal-code"
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
                                    <span>{formData.country === 'India' ? 'Free' : 'Quoted via WhatsApp'}</span>
                                </div>
                                <div className="total-row grand-total">
                                    <span>Total</span>
                                    <span>₹{total.toLocaleString('en-IN')}</span>
                                </div>
                            </div>

                            {/* Order trust indicators */}
                            <div className="secure-payment-badges">
                                <div className="secure-badge">
                                    <Icon name="fa-shipping-fast" />
                                    <span>{formData.country === 'India' ? 'Free Delivery' : 'Intl. Shipping'}</span>
                                </div>
                                <div className="secure-badge">
                                    <Icon name="fa-whatsapp" />
                                    <span>WhatsApp Confirmed</span>
                                </div>
                                <div className="secure-badge">
                                    <Icon name="fa-undo-alt" />
                                    <span>Easy Returns</span>
                                </div>
                            </div>
                        </div>

                        <div className="payment-section">
                            <h3>Payment Method</h3>

                            {(() => {
                                const isIndia = formData.country === 'India';
                                const totalBats = cart.reduce((acc, item) => acc + item.quantity, 0);
                                const booking = totalBats * COD_BOOKING_PER_BAT;
                                const remaining = total - booking;
                                const codFee = Math.round(remaining * COD_FEE_PERCENT);
                                const totalAtDoor = remaining + codFee;

                                return (
                                    <>
                                        {!isIndia && (
                                            <div className="intl-notice">
                                                <Icon name="fa-globe" />
                                                <div>
                                                    <strong>International Order</strong>
                                                    <p>Cash on Delivery is only available within India. For international orders, full payment is required. Delivery charges will be communicated to you via WhatsApp or email after your order is placed.</p>
                                                </div>
                                            </div>
                                        )}

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
                                                    <span><Icon name="fa-lock" /> Full Payment</span>
                                                    <small>Pay securely now — no extra charges</small>
                                                    {isIndia && <span className="payment-save-badge">Save ₹{codFee.toLocaleString('en-IN')} vs COD</span>}
                                                </div>
                                            </label>
                                            {isIndia && (
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
                                                        <span><Icon name="fa-money-bill-wave" /> Cash on Delivery</span>
                                                        <small>Pay ₹{COD_BOOKING_PER_BAT}/bat now + balance at door</small>
                                                    </div>
                                                </label>
                                            )}
                                        </div>

                                        {formData.paymentMethod === 'cod' && isIndia ? (
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
                                                        <span className="cod-fee-note"> — charged by India Post / DTDC, not by Wular Sports</span>
                                                    </span>
                                                    <span className="cod-fee">+ ₹{codFee.toLocaleString('en-IN')}</span>
                                                </div>
                                                <div className="cod-row cod-total-door">
                                                    <span><strong>Amount due at delivery</strong></span>
                                                    <span><strong>₹{totalAtDoor.toLocaleString('en-IN')}</strong></span>
                                                </div>
                                                <p className="cod-save-hint">
                                                    <Icon name="fa-lightbulb" /> Choose <strong>Full Payment</strong> and save ₹{codFee.toLocaleString('en-IN')} in COD charges.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="full-payment-note">
                                                <Icon name="fa-check-circle" />
                                                <p>
                                                    Pay ₹{total.toLocaleString('en-IN')} securely via Razorpay now.{' '}
                                                    {isIndia
                                                        ? <><strong>No COD charges apply.</strong> You save ₹{codFee.toLocaleString('en-IN')} compared to Cash on Delivery.</>
                                                        : <>Delivery charges for your country will be confirmed via WhatsApp or email after order placement.</>
                                                    }
                                                </p>
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
                                <span className="btn-spinner"><Icon name="fa-spinner" spin /> Processing...</span>
                            ) : (
                                "PLACE ORDER"
                            )}
                        </button>

                        {formData.country !== 'India' && (
                            <button
                                type="button"
                                className="btn-delivery-inquiry"
                                onClick={handleDeliveryInquiry}
                                disabled={isProcessing}
                                title="Ask us about delivery charges before placing your order"
                            >
                                <Icon name="fa-whatsapp" /> Ask Delivery Charges on WhatsApp
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
