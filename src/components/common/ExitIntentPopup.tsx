import { FC, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { Icon } from './Icon';

const STORAGE_KEY = 'ws_exit_popup_shown';
const COUPON_CODE = 'WELCOME100';
const EXCLUDED_PATHS = ['/checkout', '/admin', '/order-success', '/review'];

interface LiveCoupon { code: string; type: 'per_bat' | 'percent'; value: number; label: string }

/** The offer as it stands right now — null if it's switched off or expired in
 *  Admin → Marketing → Coupons (then the popup doesn't show at all) */
async function liveCoupon(): Promise<LiveCoupon | null> {
    try {
        const r = await fetch(`/api/coupon?code=${COUPON_CODE}`);
        if (!r.ok) return null;
        const c = await r.json();
        return c && c.code && Number(c.value) > 0 ? c : null;
    } catch {
        return null;
    }
}

/**
 * Exit-intent email capture popup.
 * Desktop: fires when the cursor leaves the top of the viewport (about to
 * close the tab). Mobile: fires after strong engagement (45s on site or 60%
 * page scroll) since there is no cursor. Shows once per visitor, never on
 * checkout/admin/success pages, and is fully dismissible.
 */
export const ExitIntentPopup: FC = () => {
    const router = useRouter();
    const [visible, setVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [coupon, setCoupon] = useState<LiveCoupon | null>(null);

    const isExcluded = EXCLUDED_PATHS.some(p => router.pathname.startsWith(p));

    const checking = useRef(false);
    const trigger = useCallback(async () => {
        if (checking.current) return;
        try {
            if (localStorage.getItem(STORAGE_KEY)) return;
        } catch { /* private mode */ }
        // Only promise a code that works at checkout today
        checking.current = true;
        const live = await liveCoupon();
        if (!live) return; // offer is off: don't show (and don't use up the visitor's one popup)
        try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* private mode */ }
        setCoupon(live);
        setVisible(true);
        if (typeof window !== 'undefined' && (window as any).dataLayer) {
            (window as any).dataLayer.push({ event: 'exit_popup_shown' });
        }
    }, []);

    useEffect(() => {
        if (isExcluded) return;
        try {
            if (localStorage.getItem(STORAGE_KEY)) return;
        } catch { return; }

        // Desktop: cursor exits toward the top of the window
        const onMouseOut = (e: MouseEvent) => {
            if (e.clientY <= 0 && !(e as any).relatedTarget) trigger();
        };

        // Mobile: engaged visitor — 45 seconds on site
        const timer = setTimeout(trigger, 45000);

        // Mobile: engaged visitor — scrolled 60% of the page
        const onScroll = () => {
            const scrolled = window.scrollY + window.innerHeight;
            const height = document.documentElement.scrollHeight;
            if (height > 0 && scrolled / height > 0.6 && window.scrollY > 300) trigger();
        };

        document.addEventListener('mouseout', onMouseOut);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mouseout', onMouseOut);
            window.removeEventListener('scroll', onScroll);
        };
    }, [isExcluded, trigger]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.includes('@')) {
            setError('Please enter a valid email address.');
            return;
        }
        setBusy(true);
        setError('');
        try {
            const { subscribeToNewsletter } = await import('../../services/newsletter');
            await subscribeToNewsletter(email);
            // Already-subscribed still gets the code — that's fine
            setSubmitted(true);
            if (typeof window !== 'undefined' && (window as any).dataLayer) {
                (window as any).dataLayer.push({ event: 'exit_popup_subscribed' });
            }
        } catch {
            setSubmitted(true); // never block the code over a save hiccup
        } finally {
            setBusy(false);
        }
    };

    if (!visible || isExcluded || !coupon) return null;

    // e.g. "₹100 off per bat" / "10% off" — whatever the coupon is set to in the admin panel
    const offer = coupon.label;
    const short = coupon.type === 'percent' ? `${coupon.value}% off` : `₹${coupon.value} off`;

    return (
        <div className="exit-popup-overlay" onClick={() => setVisible(false)} role="dialog" aria-modal="true" aria-labelledby="exit-popup-title">
            <div className="exit-popup" onClick={(e) => e.stopPropagation()}>
                <button className="exit-popup__close" onClick={() => setVisible(false)} aria-label="Close">
                    <Icon name="fa-times" />
                </button>

                {submitted ? (
                    <>
                        <div className="exit-popup__emoji">🎉</div>
                        <h3 id="exit-popup-title">Here's your code!</h3>
                        <div className="exit-popup__code">{coupon.code}</div>
                        <p>{offer} — enter it at checkout.</p>
                        <button className="exit-popup__cta" onClick={() => setVisible(false)}>
                            Continue Shopping
                        </button>
                    </>
                ) : (
                    <>
                        <div className="exit-popup__emoji">🏏</div>
                        <h3 id="exit-popup-title">Wait! Get {offer}</h3>
                        <p>Join the Wular Sports family and unlock your discount code instantly.</p>
                        <form onSubmit={handleSubmit}>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                autoComplete="email"
                                disabled={busy}
                                required
                            />
                            {error && <span className="error-message">{error}</span>}
                            <button type="submit" className="exit-popup__cta" disabled={busy}>
                                {busy ? 'One moment…' : `Get My ${short}`}
                            </button>
                        </form>
                        <button className="exit-popup__dismiss" onClick={() => setVisible(false)}>
                            No thanks, I'll pay full price
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
