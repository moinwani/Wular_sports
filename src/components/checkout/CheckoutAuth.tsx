import { FC, useEffect, useRef, useState } from 'react';
import { Icon } from '../common/Icon';

interface CheckoutAuthProps {
    /** Email of the signed-in (non-anonymous) user, or null when guest */
    authedEmail: string | null;
    disabled?: boolean;
}

/**
 * Optional sign-in / account creation panel for checkout.
 * Guest checkout is the default — this never blocks placing an order.
 */
export const CheckoutAuth: FC<CheckoutAuthProps> = ({ authedEmail, disabled }) => {
    const [expanded, setExpanded] = useState(false);
    const [mode, setMode] = useState<'signin' | 'register'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const googleBtnRef = useRef<HTMLDivElement>(null);

    // Render the optional Google button when the panel is open
    useEffect(() => {
        if (!expanded || authedEmail || !googleBtnRef.current) return;
        let cancelled = false;
        (async () => {
            const { renderGoogleSignInButton, signInWithGoogle } = await import('../../services/auth');
            if (cancelled || !googleBtnRef.current) return;
            renderGoogleSignInButton(googleBtnRef.current, async (response) => {
                try {
                    const user = await signInWithGoogle(response.credential);
                    if (user.email) {
                        try {
                            const { subscribeToNewsletter } = await import('../../services/newsletter');
                            subscribeToNewsletter(user.email);
                        } catch { /* newsletter optional */ }
                    }
                } catch {
                    setError('Google sign-in failed. Please try again or continue as guest.');
                }
            });
        })();
        return () => { cancelled = true; };
    }, [expanded, authedEmail]);

    const friendlyError = (err: any): string => {
        const code = err?.code || '';
        if (code.includes('email-already-in-use')) return 'An account with this email already exists — try signing in instead.';
        if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return 'Incorrect email or password.';
        if (code.includes('weak-password')) return 'Password must be at least 6 characters.';
        if (code.includes('invalid-email')) return 'Please enter a valid email address.';
        if (code.includes('too-many-requests')) return 'Too many attempts — please wait a minute and try again.';
        return 'Something went wrong. Please try again or continue as guest.';
    };

    const handleSubmit = async () => {
        if (!email.trim() || !password) {
            setError('Please enter your email and password.');
            return;
        }
        setBusy(true);
        setError('');
        try {
            const { registerWithEmail, signInWithEmail } = await import('../../services/auth');
            if (mode === 'register') {
                await registerWithEmail(email.trim(), password);
                setNotice(`Account created! We've sent a verification email to ${email.trim()} — you can finish your order right away.`);
            } else {
                await signInWithEmail(email.trim(), password);
                setNotice('');
            }
            setPassword('');
        } catch (err: any) {
            setError(friendlyError(err));
        } finally {
            setBusy(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email.trim()) {
            setError('Enter your email above first, then tap "Forgot password".');
            return;
        }
        try {
            const { sendPasswordReset } = await import('../../services/auth');
            await sendPasswordReset(email.trim());
            setNotice(`Password reset link sent to ${email.trim()}.`);
            setError('');
        } catch (err: any) {
            setError(friendlyError(err));
        }
    };

    const handleSignOut = async () => {
        try {
            const { signOut } = await import('../../services/auth');
            await signOut();
            setNotice('');
        } catch { /* ignore */ }
    };

    if (authedEmail) {
        return (
            <div className="checkout-auth checkout-auth--signedin">
                <span className="checkout-auth__status">
                    <Icon name="fa-user-circle" /> Signed in as <strong>{authedEmail}</strong>
                </span>
                {notice && <span className="checkout-auth__notice">{notice}</span>}
                <button type="button" className="checkout-auth__link" onClick={handleSignOut} disabled={disabled}>
                    Sign out
                </button>
            </div>
        );
    }

    if (!expanded) {
        return (
            <div className="checkout-auth">
                <span className="checkout-auth__status">
                    <Icon name="fa-check-circle" /> Checking out as guest — no account needed.
                </span>
                <button type="button" className="checkout-auth__link" onClick={() => setExpanded(true)} disabled={disabled}>
                    Sign in / Create account (optional)
                </button>
            </div>
        );
    }

    return (
        <div className="checkout-auth checkout-auth--open">
            <div className="checkout-auth__tabs">
                <button
                    type="button"
                    className={mode === 'signin' ? 'active' : ''}
                    onClick={() => { setMode('signin'); setError(''); }}
                >
                    Sign In
                </button>
                <button
                    type="button"
                    className={mode === 'register' ? 'active' : ''}
                    onClick={() => { setMode('register'); setError(''); }}
                >
                    Create Account
                </button>
            </div>

            <div ref={googleBtnRef} className="checkout-auth__google"></div>
            <div className="checkout-auth__divider"><span>or use email</span></div>

            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                disabled={busy || disabled}
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Create a password (min. 6 characters)' : 'Password'}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                disabled={busy || disabled}
            />

            {error && <span className="error-message">{error}</span>}
            {notice && <span className="checkout-auth__notice">{notice}</span>}

            <button type="button" className="checkout-auth__submit" onClick={handleSubmit} disabled={busy || disabled}>
                {busy ? 'Please wait…' : mode === 'register' ? 'Create Account' : 'Sign In'}
            </button>

            {mode === 'register' && (
                <small className="checkout-auth__hint">
                    We'll email you a verification link — it won't hold up your order.
                </small>
            )}

            <div className="checkout-auth__footer">
                {mode === 'signin' && (
                    <button type="button" className="checkout-auth__link" onClick={handleForgotPassword} disabled={busy}>
                        Forgot password?
                    </button>
                )}
                <button type="button" className="checkout-auth__link" onClick={() => setExpanded(false)} disabled={busy}>
                    Continue as guest instead
                </button>
            </div>
        </div>
    );
};
