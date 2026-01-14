import { FC, ReactNode, useState, useEffect } from 'react';
import { isAdmin } from '../../services/auth';

interface AdminRouteProps {
    children: ReactNode;
}

/**
 * Admin Route Guard
 * Protects admin routes - only accessible to users with admin custom claim
 */
export const AdminRoute: FC<AdminRouteProps> = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        checkAdminStatus();
    }, []);

    const checkAdminStatus = async () => {
        try {
            const adminStatus = await isAdmin();
            setAuthorized(adminStatus);
        } catch (error) {
            console.error('Error checking admin status:', error);
            setAuthorized(false);
        } finally {
            setLoading(false);
        }
    };

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
                    <i className="fas fa-lock" style={{ fontSize: '64px', color: '#8b0000', marginBottom: '20px' }}></i>
                    <h1>Unauthorized Access</h1>
                    <p>You do not have permission to access the admin panel.</p>
                    <p className="hint">Admin privileges required. Please contact the administrator.</p>
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
