import { FC, useState, useEffect } from 'react';
import { useAllOrders } from '../../hooks/useOrders';
import { getAllSubscribers, getOrderAnalytics } from '../../services/admin';
import { Icon } from '../common/Icon';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: string;
    color: string;
}

const StatCard: FC<StatCardProps> = ({ title, value, icon, color }) => (
    <div className="admin-stat-card">
        <div className="stat-icon" style={{ backgroundColor: color }}>
            <Icon name={icon} />
        </div>
        <div className="stat-content">
            <h3>{title}</h3>
            <p className="stat-value">{value}</p>
        </div>
    </div>
);

export const AdminDashboard: FC = () => {
    const { orders, loading } = useAllOrders();
    const [subscriberCount, setSubscriberCount] = useState(0);
    const [subscriberError, setSubscriberError] = useState(false);
    const [analytics, setAnalytics] = useState({
        totalOrders: 0,
        paidOrders: 0,
        totalRevenue: 0,
        monthRevenue: 0,
        needsAction: 0,
        abandonedCheckouts: 0,
        codPending: 0,
        totalSubscribers: 0,
        recentOrders: [] as any[]
    });

    useEffect(() => {
        if (orders.length > 0) {
            const stats = getOrderAnalytics(orders);
            setAnalytics(prev => ({ ...stats, totalSubscribers: prev.totalSubscribers }));
        }
    }, [orders]);

    useEffect(() => {
        // Fetch subscriber count
        getAllSubscribers()
            .then(subs => {
                setSubscriberCount(subs.length);
                setSubscriberError(false);
                setAnalytics(prev => ({ ...prev, totalSubscribers: subs.length }));
            })
            .catch(err => {
                console.error('Subscriber fetch failed:', err);
                setSubscriberError(true);
            });
    }, []);

    if (loading) {
        return (
            <div className="admin-loading">
                <div className="loading-spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <h1>Dashboard Overview</h1>

            <div className="admin-stats-grid">
                <StatCard
                    title="Revenue (Paid Orders)"
                    value={`₹${analytics.totalRevenue.toLocaleString('en-IN')}`}
                    icon="fa-rupee-sign"
                    color="#388e3c"
                />
                <StatCard
                    title="This Month"
                    value={`₹${analytics.monthRevenue.toLocaleString('en-IN')}`}
                    icon="fa-chart-line"
                    color="#00897b"
                />
                <StatCard
                    title="Paid Orders"
                    value={analytics.paidOrders}
                    icon="fa-shopping-cart"
                    color="#1976d2"
                />
                <StatCard
                    title="To Pack & Ship"
                    value={analytics.needsAction}
                    icon="fa-box-open"
                    color="#f57c00"
                />
                <StatCard
                    title="Abandoned Checkouts"
                    value={analytics.abandonedCheckouts}
                    icon="fa-clock"
                    color="#8b0000"
                />
                <StatCard
                    title="Subscribers"
                    value={subscriberError ? '—' : subscriberCount}
                    icon="fa-users"
                    color="#5e35b1"
                />
            </div>

            {analytics.abandonedCheckouts > 0 && (
                <p className="dashboard-hint">
                    💡 <strong>{analytics.abandonedCheckouts} abandoned checkout{analytics.abandonedCheckouts > 1 ? 's' : ''}</strong> — these customers filled in their details but didn't pay. Find them under Orders → filter "Pending" and follow up on WhatsApp; many will complete the purchase.
                </p>
            )}
            {analytics.codPending > 0 && (
                <p className="dashboard-hint">
                    💰 <strong>{analytics.codPending} COD order{analytics.codPending > 1 ? 's' : ''}</strong> still have balance due at delivery. Mark payment "Completed" once the courier collects it.
                </p>
            )}
            {subscriberError && (
                <p className="dashboard-hint">
                    ⚠️ Couldn't load subscribers — make sure the latest Firestore rules are published and you're signed in as the store owner.
                </p>
            )}

            <div className="recent-orders-section">
                <h2>Recent Orders</h2>
                {analytics.recentOrders.length === 0 ? (
                    <p className="empty-state">No orders yet</p>
                ) : (
                    <div className="recent-orders-list">
                        {analytics.recentOrders.map((order: any) => (
                            <div key={order.id} className="recent-order-item">
                                <div className="order-info">
                                    <strong>{order.orderNumber || order.id}</strong>
                                    <span className="order-customer">{order.customerName}</span>
                                </div>
                                <div className="order-meta">
                                    <span className={`status-badge status-${order.status}`}>
                                        {order.status}
                                    </span>
                                    <span className="order-total">₹{order.total?.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
