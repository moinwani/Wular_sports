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
    const [analytics, setAnalytics] = useState({
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
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
                setAnalytics(prev => ({ ...prev, totalSubscribers: subs.length }));
            })
            .catch(() => {});
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
                    title="Total Orders"
                    value={analytics.totalOrders}
                    icon="fa-shopping-cart"
                    color="#1976d2"
                />
                <StatCard
                    title="Total Revenue"
                    value={`₹${analytics.totalRevenue.toLocaleString()}`}
                    icon="fa-rupee-sign"
                    color="#388e3c"
                />
                <StatCard
                    title="Pending Orders"
                    value={analytics.pendingOrders}
                    icon="fa-clock"
                    color="#f57c00"
                />
                <StatCard
                    title="Subscribers"
                    value={subscriberCount}
                    icon="fa-users"
                    color="#8b0000"
                />
            </div>

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
