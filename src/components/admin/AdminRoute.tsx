import { FC, ReactNode, useState, useEffect, useRef } from 'react';
import { isAdmin } from '../../services/auth';
import { Icon } from '../common/Icon';

interface AdminRouteProps {
    children: ReactNode;
}

/**
 * Admin Route Guard
 * Only the store owner's Google account (ADMIN_EMAIL) — or a user with the
 * admin custom claim — can access admin routes. Re-checks live on every
 * auth state change so signing in on this page unlocks it immediately.
 */
export const AdminRoute: FC<AdminRouteProps> = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const googleBtnRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        (async () => {
            try {
                const { subscribeToAuthChanges } = await import('../../services/auth');
                unsubscribe = subscribeToAuthChanges(async () => {
                    try {
                        setAuthorized(await isAdmin());
                    } catch {
                        setAuthorized(false);
                    } finally {
                        setLoading(false);
                    }
                });
            } catch {
                setAuthorized(false);
                setLoading(false);
            }
        })();
        return () => { if (unsubscribe) unsubscribe(); };
    }, []);

    // Offer Google sign-in directly on the unauthorized screen
    useEffect(() => {
        if (loading || authorized || !googleBtnRef.current) return;
        let cancelled = false;
        (async () => {
            const { renderGoogleSignInButton, signInWithGoogle } = await import('../../services/auth');
            if (cancelled || !googleBtnRef.current) return;
            renderGoogleSignInButton(googleBtnRef.current, async (response) => {
                try {
                    await signInWithGoogle(response.credential);
                    // The auth subscription above re-runs the admin check
                } catch (err) {
                    console.error('Admin sign-in failed:', err);
                }
            });
        })();
        return () => { cancelled = true; };
    }, [loading, authorized]);

    if (loading) {
        return (
            <div className="admin-loading">
                <div className="loading-spinner"></div>
                <p>Verifying authorization...</p>
            </div>
        );
    }

    if (!authorized) {
        return (
            <div className="admin-unauthorized">
                <div className="unauthorized-content">
                    <Icon name="fa-lock" style={{ fontSize: '64px', color: '#8b0000', marginBottom: '20px' }} />
                    <h1>Admin Access</h1>
                    <p>Sign in with the store owner's Google account to open the admin panel.</p>
                    <div
                        ref={googleBtnRef}
                        style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}
                    ></div>
                    <p className="hint">Signed in with a different account? Only the owner's email is allowed.</p>
                    <button
                        className="btn"
                        onClick={() => window.location.href = '/'}
                        style={{ marginTop: '20px' }}
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
