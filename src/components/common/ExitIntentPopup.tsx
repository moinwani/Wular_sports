import { FC, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Icon } from './Icon';
import { COUPONS } from '../../data/coupons';

const STORAGE_KEY = 'ws_exit_popup_shown';
const COUPON_CODE = 'WELCOME100';
const EXCLUDED_PATHS = ['/checkout', '/admin', '/order-success', '/review'];

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

    const isExcluded = EXCLUDED_PATHS.some(p => router.pathname.startsWith(p));

    const trigger = useCallback(() => {
        try {
            if (localStorage.getItem(STORAGE_KEY)) return;
            localStorage.setItem(STORAGE_KEY, '1');
        } catch { /* private mode */ }
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

    if (!visible || isExcluded) return null;

    return (
        <div className="exit-popup-overlay" onClick={() => setVisible(false)} role="dialog" aria-modal="true">
            <div className="exit-popup" onClick={(e) => e.stopPropagation()}>
                <button className="exit-popup__close" onClick={() => setVisible(false)} aria-label="Close">
                    <Icon name="fa-times" />
                </button>

                {submitted ? (
                    <>
                        <div className="exit-popup__emoji">🎉</div>
                        <h3>Here's your code!</h3>
                        <div className="exit-popup__code">{COUPON_CODE}</div>
                        <p>{COUPONS[COUPON_CODE].label} — enter it at checkout.</p>
                        <button className="exit-popup__cta" onClick={() => setVisible(false)}>
                            Continue Shopping
                        </button>
                    </>
                ) : (
                    <>
                        <div className="exit-popup__emoji">🏏</div>
                        <h3>Wait! Get ₹100 off per bat</h3>
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
                                {busy ? 'One moment…' : 'Get My ₹100 Off'}
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
