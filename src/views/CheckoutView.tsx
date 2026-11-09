import { FC, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { CartItem } from '../types';
import { normalizeIndianPhone, validateFormData } from '../utils/inputValidation';
import { buildCheckoutSchema } from '../utils/checkoutSchema';
import { getVisitorRef } from '../utils/helpers';
import { normalizeCouponCode } from '../data/coupons';
import { couponDiscount, CouponType } from '../lib/marketing';
import { getAttribution } from '../utils/attributionCapture';
import { WHATSAPP_NUMBER } from '../data/constants';
import { SEOHead } from '../components/common/SEOHead';
import { Icon } from '../components/common/Icon';
import { CheckoutAuth } from '../components/checkout/CheckoutAuth';
import { useCart } from '../context/CartContext';
import { useCatalog } from '../context/CatalogContext';

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

/*
 * Unfinished payments. Before the Razorpay window opens, the order it pays for
 * is remembered in this browser. If the window is closed, the page reloads
 * (e.g. Android closed the tab while the buyer was in their UPI app) or the
 * payment check doesn't get through, the checkout asks the server whether that
 * order was paid before letting the buyer pay again — and a retry reuses the
 * same Razorpay order, which Razorpay never lets anyone pay twice.
 */
const PENDING_KEY = 'ws_pending_payment';
const PENDING_MAX_AGE_MS = 45 * 60 * 1000;

interface PendingPayment {
    firestoreOrderId: string;
    razorpayOrderId: string;
    chargeAmount: number;
    isCOD: boolean;
    description: string;
    /** what was being bought, so a changed cart or address gets a new order */
    key: string;
    createdAt: number;
}

const loadPending = (): PendingPayment | null => {
    try {
        const p = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null');
        return p && p.firestoreOrderId && Date.now() - p.createdAt < PENDING_MAX_AGE_MS ? p : null;
    } catch {
        return null;
    }
};
const savePending = (p: PendingPayment) => { try { localStorage.setItem(PENDING_KEY, JSON.stringify(p)); } catch { /* private mode */ } };
const clearPending = () => { try { localStorage.removeItem(PENDING_KEY); } catch { /* private mode */ } };

/** Firebase sign-in token for the order APIs; `fresh` forces a new one (after a 401) */
async function orderToken(fresh = false): Promise<string> {
    const { ensureAuthenticated, getCurrentUser } = await import('../services/auth');
    await ensureAuthenticated();
    const user = getCurrentUser();
    return user ? user.getIdToken(fresh) : '';
}

/** Ask the server whether an order has been paid (null = couldn't find out) */
async function fetchOrderStatus(firestoreOrderId: string): Promise<{ paid: boolean; processing?: boolean } | null> {
    try {
        const res = await fetch('/api/order-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await orderToken()}` },
            body: JSON.stringify({ firestoreOrderId }),
        });
        return res.ok ? await res.json() : null;
    } catch {
        return null;
    }
}

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * Confirm a payment with the server, retrying through weak signal, an expired
 * sign-in or a busy server. 'invalid' = Razorpay's signature didn't match.
 * The sign-in token is only refreshed when the server says it expired — a
 * dropped connection just retries with the token already in hand.
 */
async function verifyPayment(body: Record<string, string>): Promise<'ok' | 'invalid' | 'unreachable'> {
    let token = await orderToken().catch(() => '');
    for (let attempt = 0; attempt < 4; attempt++) {
        if (attempt) await wait([0, 1500, 3000, 5000][attempt]);
        try {
            const res = await fetch('/api/verify-razorpay-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(body),
            });
            if (res.ok) return 'ok';
            if (res.status === 400) return 'invalid';
            if (res.status === 401) token = await orderToken(true).catch(() => token);
        } catch { /* network — try again */ }
    }
    return 'unreachable';
}

interface CheckoutViewProps {
    cart: CartItem[];
    total: number;
    onPlaceOrder: (orderDetails: any) => void;
}


export const CheckoutView: FC<CheckoutViewProps> = ({ cart, total, onPlaceOrder }) => {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    // Phones: show what's being bought up front (most carts are one or two bats)
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);

    // Pull the newest prices so the cart shows exactly what Razorpay will charge
    const { refresh: refreshCatalog } = useCatalog();
    useEffect(() => { refreshCatalog(); }, [refreshCatalog]);

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
    // Payment flow: the success callback has fired / the order has been shown as placed
    const paidRef = useRef(false);
    const finishedRef = useRef(false);
    // Razorpay reported a payment whose signature didn't check out (payment id)
    const [paymentProblem, setPaymentProblem] = useState<string | null>(null);
    const [isEmailFromAuth, setIsEmailFromAuth] = useState(false);
    const [authedEmail, setAuthedEmail] = useState<string | null>(null);
    const { clearCart, unavailable, dismissUnavailable } = useCart();

    // Release the synchronous double-submit lock whenever processing ends
    useEffect(() => {
        if (!isProcessing) submitLockRef.current = false;
    }, [isProcessing]);

    // Back on the checkout with a payment that wasn't finished here (e.g. Android
    // closed the tab while the buyer was in their UPI app): if it went through,
    // show the order instead of asking them to pay again
    useEffect(() => {
        const pending = loadPending();
        if (!pending) return;
        let cancelled = false;
        fetchOrderStatus(pending.firestoreOrderId).then(status => {
            if (!cancelled && status?.paid) finishPaidOrder(pending.firestoreOrderId, pending.isCOD, '');
        });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Lead capture: once the visitor has entered a reachable contact detail
    // (phone or email), save the partial form (debounced) so we can follow up
    // even if they never complete the order.
    useEffect(() => {
        if (isProcessing || pendingWhatsApp) return;
        const hasContact =
            formData.phone.replace(/\D/g, '').length >= 7 ||
            formData.email.includes('@');
        if (!hasContact) return;

        const timer = setTimeout(() => {
            import('../services/leads')
                .then(({ saveCheckoutLead }) => saveCheckoutLead(formData, cart, total))
                .catch(() => { /* best-effort */ });
        }, 2500);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData, isProcessing, pendingWhatsApp]);

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

    // Coupon state — server revalidates and recomputes the discount
    const [couponInput, setCouponInput] = useState('');
    const [activeCoupon, setActiveCoupon] = useState<{ code: string; type: CouponType; value: number } | null>(null);
    const [couponError, setCouponError] = useState('');
    const [couponChecking, setCouponChecking] = useState(false);
    const appliedCoupon = activeCoupon?.code || null;
    const cartBats = cart.reduce((acc, item) => acc + item.quantity, 0);
    const discount = activeCoupon ? couponDiscount(activeCoupon, total, cartBats) : 0;
    const payable = total - discount;

    const handleApplyCoupon = async () => {
        const code = normalizeCouponCode(couponInput);
        if (!code || couponChecking) return;
        setCouponChecking(true);
        try {
            const res = await fetch(`/api/coupon?code=${encodeURIComponent(code)}`);
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setCouponError(data.error || 'Invalid coupon code');
                return;
            }
            setActiveCoupon({ code: data.code, type: data.type, value: data.value });
            setCouponError('');
            setCouponInput('');
            if (typeof window !== 'undefined' && window.dataLayer) {
                window.dataLayer.push({ event: 'coupon_applied', coupon: data.code });
            }
        } catch {
            setCouponError('Could not check the coupon. Please try again.');
        } finally {
            setCouponChecking(false);
        }
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

        let filteredValue = value;
        if (name === 'firstName' || name === 'lastName') {
            // Only letters, spaces, hyphens, apostrophes, and dots
            filteredValue = value.replace(/[^\p{L}\p{M}\s\-'\.]/gu, '');
        } else if (name === 'phone') {
            // Digits only. India: room for a pasted/autofilled "+91 98765 43210" or
            // "098765 43210" — tidied to the 10 digits when the field is left
            const maxDigits = formData.countryCode === '+91' ? 14 : 15;
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
        const remaining = payable - bookingAmount;
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
                (discount > 0 ? `*Coupon (${appliedCoupon}):* −₹${discount.toLocaleString('en-IN')}\n` : '') +
                `*Total Amount:* ₹${payable.toLocaleString('en-IN')}`;
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
            `Please confirm the delivery charges for this address. Thank you!` +
            (getVisitorRef() ? `\n\n(Ref: ${getVisitorRef()})` : '');

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
        import('../services/leads').then(({ trackWhatsAppClick }) =>
            trackWhatsAppClick('delivery_inquiry', formData.country, { type: 'delivery_inquiry', total })
        ).catch(() => { /* best-effort */ });
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const openRazorpay = (
        razorpayOrderId: string,
        amountPaise: number,
        description: string,
        sanitizedData: typeof formData,
        onSuccess: (paymentId: string, rzpOrderId: string, signature: string) => void,
        onDismiss: () => void
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
            modal: { ondismiss: onDismiss }
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
    };

    /** The order is paid: thank the buyer, track the purchase once, empty the cart */
    const finishPaidOrder = async (firestoreOrderId: string, isCOD: boolean, paymentId: string, sanitizedData?: typeof formData) => {
        if (finishedRef.current) return;
        finishedRef.current = true;
        clearPending();

        // This visitor is now a customer — stop showing them as a lead
        import('../services/leads')
            .then(({ markLeadConverted }) => markLeadConverted())
            .catch(() => { /* best-effort */ });

        // Order emails and the Meta purchase are sent by the server (verify
        // endpoint + Razorpay webhook), so they go out even if this page dies.
        // Same event id the server uses for Meta, so the pixel and the server
        // copy are counted once.
        const eventId = `purchase_${firestoreOrderId}`;
        if (typeof window !== 'undefined' && window.dataLayer) {
            const userData: Record<string, string> = {};
            if (sanitizedData?.email) {
                try { userData.em = await hashData(sanitizedData.email); } catch { /* silent */ }
            }
            if (sanitizedData?.phone) {
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
                    value: payable,
                    currency: 'INR',
                    coupon: appliedCoupon || undefined,
                    payment_type: isCOD ? 'cod' : 'full',
                    items: cart.map(item => ({
                        item_id: item.id,
                        item_name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                    }))
                }
            };
            if (Object.keys(userData).length > 0) payload.user_data = userData;
            window.dataLayer.push(payload);
        }

        if (isCOD && sanitizedData) {
            window.dataLayer?.push({
                event: 'whatsapp_order_confirm',
                source: 'checkout_cod',
                type: 'order_confirmation',
                order_id: firestoreOrderId,
                total: payable,
            });
            const whatsappUrl = buildWhatsAppUrl(firestoreOrderId, sanitizedData);
            whatsAppUrlRef.current = whatsappUrl;
            savedOrderIdRef.current = firestoreOrderId;
            // Booking is paid and the order is saved — clear the cart now
            clearCart();
            setPendingWhatsApp({ whatsappUrl });
            setIsProcessing(false);
        } else {
            onPlaceOrder({ id: firestoreOrderId, items: cart, total: payable, paymentId });
        }
    };

    /** Razorpay's window was closed without a success callback */
    const handleDismiss = async (pending: PendingPayment, sanitizedData: typeof formData) => {
        if (paidRef.current) return; // the success callback is already handling it
        // A UPI payment can complete after the window is closed — check first
        const status = await fetchOrderStatus(pending.firestoreOrderId);
        if (status?.paid) {
            await finishPaidOrder(pending.firestoreOrderId, pending.isCOD, '', sanitizedData);
            return;
        }
        setIsProcessing(false);
        setFormError(status?.processing
            ? 'Your bank is still confirming the payment. Please wait a minute, then tap Pay again — you won\'t be charged twice.'
            : 'Payment not completed. Tap Pay to try again — you won\'t be charged twice.');
    };

    /** Razorpay says the payment went through */
    const handlePaid = async (pending: PendingPayment, sanitizedData: typeof formData, paymentId: string, rzpOrderId: string, signature: string) => {
        paidRef.current = true;
        setIsProcessing(true);
        const result = await verifyPayment({
            razorpay_order_id: rzpOrderId,
            razorpay_payment_id: paymentId,
            razorpay_signature: signature,
            firestoreOrderId: pending.firestoreOrderId,
        });
        if (result === 'invalid') {
            setPaymentProblem(paymentId);
            setIsProcessing(false);
            return;
        }
        // Verified — or the check couldn't get through on a weak signal. Either way the
        // money has been taken and the server confirms the order itself (Razorpay
        // webhook), so never offer to pay again: show the order as placed.
        await finishPaidOrder(pending.firestoreOrderId, pending.isCOD, paymentId, sanitizedData);
    };

    const startPayment = (pending: PendingPayment, sanitizedData: typeof formData) => {
        paidRef.current = false;
        openRazorpay(
            pending.razorpayOrderId,
            pending.chargeAmount * 100,
            pending.description,
            sanitizedData,
            (paymentId, rzpOrderId, signature) => { handlePaid(pending, sanitizedData, paymentId, rzpOrderId, signature); },
            () => { handleDismiss(pending, sanitizedData); }
        );
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

            const isCOD = sanitizedData.paymentMethod === 'cod';
            const totalBats = cart.reduce((acc, item) => acc + item.quantity, 0);
            const items = cart.map(item => ({ id: item.id, quantity: item.quantity, size: item.size }));
            const customer = {
                firstName: sanitizedData.firstName,
                lastName: sanitizedData.lastName,
                email: sanitizedData.email,
                phone: sanitizedData.phone,
                countryCode: sanitizedData.countryCode,
                address: sanitizedData.address,
                city: sanitizedData.city,
                state: sanitizedData.state,
                zip: sanitizedData.zip,
                country: sanitizedData.country,
            };
            const key = JSON.stringify({ items, method: sanitizedData.paymentMethod, coupon: appliedCoupon || '', customer });

            // Same cart and details as a payment that wasn't finished: was it paid
            // after all? If not, retry it with the same Razorpay order (which can
            // never be paid twice) instead of starting a second one.
            const pending = loadPending();
            if (pending && pending.key === key) {
                const status = await fetchOrderStatus(pending.firestoreOrderId);
                if (status?.paid) {
                    await finishPaidOrder(pending.firestoreOrderId, pending.isCOD, '', sanitizedData);
                    return;
                }
                if (status) {
                    startPayment(pending, sanitizedData);
                    return;
                }
                // Couldn't check — start a new order below
            }

            // Create the Razorpay order on the server — the amount is computed there.
            // Shipping details go with it so the order is saved BEFORE payment and a
            // paid order can never be lost even if this browser dies mid-payment.
            const res = await fetch('/api/create-razorpay-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await orderToken()}`,
                },
                body: JSON.stringify({
                    items,
                    paymentMethod: sanitizedData.paymentMethod,
                    coupon: appliedCoupon || undefined,
                    // Which ad / post brought this buyer (for the Marketing tab and Meta)
                    attribution: getAttribution(),
                    customer,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                // The server's message says what to fix (a size, a bat no longer sold, a coupon…)
                setFormError(res.status === 401
                    ? 'Your session expired. Please tap Pay again.'
                    : data.error || 'Something went wrong. Please try again or contact us on WhatsApp.');
                setIsProcessing(false);
                return;
            }

            // The server prices every order from the live catalog. If a price changed
            // since this page loaded, show the new total before taking any money.
            if (Number(data.orderTotal) !== payable) {
                refreshCatalog();
                setFormError(`A price was just updated — your total is now ₹${Number(data.orderTotal).toLocaleString('en-IN')}. Please check it and tap Pay again.`);
                setIsProcessing(false);
                return;
            }

            const next: PendingPayment = {
                firestoreOrderId: data.firestoreOrderId,
                razorpayOrderId: data.orderId,
                chargeAmount: Number(data.chargeAmount),
                isCOD,
                description: isCOD
                    ? `COD Booking — ₹${COD_BOOKING_PER_BAT} × ${totalBats} bat(s)`
                    : `Full Payment — Wular Sports Order`,
                key,
                createdAt: Date.now(),
            };
            savePending(next);
            startPayment(next, sanitizedData);
        } catch (error: any) {
            console.error('Order process failed:', error);
            setFormError(/authenticat|Unable to process/i.test(error?.message || '')
                ? 'Unable to start your order. Please refresh the page and try again.'
                : 'Something went wrong. Please check your connection and try again, or contact us on WhatsApp.'
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
                        <h2>Order placed — booking paid ✅</h2>
                        <p>One last step: <strong>send us your order on WhatsApp</strong> so we can confirm your delivery details. The message is already written — just tap Send.</p>

                        {whatsAppReminderVisible && (
                            <div className="whatsapp-reminder-banner">
                                <Icon name="fa-exclamation-circle" /> Please send the WhatsApp message — it helps us confirm your delivery quickly.
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
                            <Icon name="fa-whatsapp" /> Send Order on WhatsApp
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
                            <Icon name="fa-check-circle" /> Done — I've Sent It
                        </button>
                        </div>
                        <p className="whatsapp-confirm-note">Once we receive your message, we'll process and ship your order within 24 hours.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (paymentProblem) {
        const help = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi Wular Sports, I paid for my order but the website couldn't confirm it. Payment ID: ${paymentProblem}`)}`;
        return (
            <div className="container checkout-empty">
                <SEOHead title="Checkout | Wular Sports" robots="noindex, nofollow" canonicalUrl="https://wularsports.com/checkout" />
                <h2>We've received a payment but couldn't confirm it automatically</h2>
                <p style={{ color: '#bbb', margin: '1rem 0' }}>Please don't pay again. Send us your payment ID on WhatsApp and we'll confirm your order right away.</p>
                <p style={{ margin: '0 0 1.5rem' }}>Payment ID: <strong>{paymentProblem}</strong></p>
                <a className="btn" href={help} target="_blank" rel="noopener noreferrer">Message Us on WhatsApp</a>
            </div>
        );
    }

    if (cart.length === 0) {
        return (
            <div className="container checkout-empty">
                <SEOHead title="Checkout | Wular Sports" robots="noindex, nofollow" canonicalUrl="https://wularsports.com/checkout" />
                {unavailable.length > 0 && (
                    <p className="checkout-unavailable" role="status">
                        {unavailable.join(', ')} {unavailable.length === 1 ? 'is' : 'are'} no longer available and {unavailable.length === 1 ? 'was' : 'were'} removed from your cart.
                    </p>
                )}
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
                        <span className="toggle-total">₹{payable.toLocaleString('en-IN')}</span>
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
                        {discount > 0 && (
                            <div className="summary-row-mini" style={{ color: '#4ade80' }}>
                                <span>Coupon {appliedCoupon}</span>
                                <span>−₹{discount.toLocaleString('en-IN')}</span>
                            </div>
                        )}
                        <div className="summary-row-mini">
                            <span>Shipping</span>
                            <span>Free</span>
                        </div>
                    </div>
                </div>
                {unavailable.length > 0 && (
                    <div className="checkout-unavailable" role="status">
                        <span>{unavailable.join(', ')} {unavailable.length === 1 ? 'is' : 'are'} no longer available and {unavailable.length === 1 ? 'was' : 'were'} removed from your cart.</span>
                        <button type="button" onClick={dismissUnavailable} aria-label="Dismiss">×</button>
                    </div>
                )}
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
                        <p className="checkout-privacy-note">
                            <Icon name="fa-lock" /> Your details are saved securely as you type, so we can assist you with your order.
                        </p>

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
                                        maxLength={20}
                                        onBlur={() => {
                                            if (isIndianPhone) setFormData(prev => ({ ...prev, phone: normalizeIndianPhone(prev.phone) }));
                                        }}
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
                                {discount > 0 && (
                                    <div className="total-row" style={{ color: '#4ade80' }}>
                                        <span>Coupon {appliedCoupon}</span>
                                        <span>−₹{discount.toLocaleString('en-IN')}</span>
                                    </div>
                                )}
                                <div className="total-row">
                                    <span>Shipping</span>
                                    <span>{formData.country === 'India' ? 'Free' : 'Quoted via WhatsApp'}</span>
                                </div>
                                <div className="total-row grand-total">
                                    <span>Total</span>
                                    <span>₹{payable.toLocaleString('en-IN')}</span>
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

                        {/* Coupon */}
                        <div className="coupon-box">
                            {appliedCoupon ? (
                                <div className="coupon-applied">
                                    <span><Icon name="fa-check-circle" /> Coupon <strong>{appliedCoupon}</strong> applied — you save ₹{discount.toLocaleString('en-IN')}</span>
                                    <button
                                        type="button"
                                        onClick={() => { setActiveCoupon(null); setCouponError(''); }}
                                        disabled={isProcessing}
                                        aria-label="Remove coupon"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="coupon-input-row">
                                        <input
                                            type="text"
                                            value={couponInput}
                                            onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                                            placeholder="Have a coupon code?"
                                            disabled={isProcessing}
                                            autoComplete="off"
                                        />
                                        <button type="button" onClick={handleApplyCoupon} disabled={isProcessing || couponChecking || !couponInput.trim()}>
                                            {couponChecking ? 'Checking…' : 'Apply'}
                                        </button>
                                    </div>
                                    {couponError && <span className="error-message">{couponError}</span>}
                                </>
                            )}
                        </div>

                        <div className="payment-section">
                            <h3>Payment Method</h3>

                            {(() => {
                                const isIndia = formData.country === 'India';
                                const totalBats = cart.reduce((acc, item) => acc + item.quantity, 0);
                                const booking = totalBats * COD_BOOKING_PER_BAT;
                                const remaining = payable - booking;
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
                                                    <span>Order total{discount > 0 ? ' (after coupon)' : ''}</span>
                                                    <span>₹{payable.toLocaleString('en-IN')}</span>
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
                                                    Pay ₹{payable.toLocaleString('en-IN')} securely via Razorpay now.{' '}
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
                                <><Icon name="fa-lock" /> {formData.paymentMethod === 'cod' && isIndiaOrder
                                    ? `Pay ₹${(COD_BOOKING_PER_BAT * cartBats).toLocaleString('en-IN')} booking & place order`
                                    : `Pay ₹${payable.toLocaleString('en-IN')} & place order`}</>
                            )}
                        </button>
                        <p className="checkout-secure-note">
                            <Icon name="fa-shield-alt" /> Secure payment by Razorpay — UPI, cards, net banking
                        </p>
                        <p className="checkout-help">
                            Questions before you pay?{' '}
                            <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi! I have a question before placing my order.${getVisitorRef() ? ` (Ref: ${getVisitorRef()})` : ''}`)}`} target="_blank" rel="noopener noreferrer">
                                Chat with us on WhatsApp
                            </a>
                        </p>

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
