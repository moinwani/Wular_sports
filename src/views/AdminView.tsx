import { FC, useState } from 'react';
import { AdminRoute } from '../components/admin/AdminRoute';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { AnalyticsDashboard } from '../components/admin/AnalyticsDashboard';
import { MarketingDashboard } from '../components/admin/MarketingDashboard';
import { ProductsManagement } from '../components/admin/ProductsManagement';
import { OrdersManagement } from '../components/admin/OrdersManagement';
import { CustomersManagement } from '../components/admin/CustomersManagement';
import { SubscribersManagement } from '../components/admin/SubscribersManagement';
import { LeadsManagement } from '../components/admin/LeadsManagement';
import { ReviewsManagement } from '../components/admin/ReviewsManagement';
import { AdminDataProvider } from '../hooks/useAdminData';
import { Icon } from '../components/common/Icon';

export type AdminTab = 'dashboard' | 'analytics' | 'marketing' | 'customers' | 'orders' | 'products' | 'leads' | 'reviews' | 'subscribers';

const TABS: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Today', icon: 'fa-inbox' },
    { id: 'analytics', label: 'Analytics', icon: 'fa-chart-line' },
    { id: 'marketing', label: 'Marketing', icon: 'fa-bullhorn' },
    { id: 'customers', label: 'Customers', icon: 'fa-users' },
    { id: 'orders', label: 'Orders', icon: 'fa-shopping-cart' },
    { id: 'products', label: 'Products', icon: 'fa-box-open' },
    { id: 'leads', label: 'Leads', icon: 'fa-user-circle' },
    { id: 'reviews', label: 'Reviews', icon: 'fa-star' },
    { id: 'subscribers', label: 'Subscribers', icon: 'fa-envelope' },
];

export const AdminView: FC = () => {
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

    const handleLogout = () => {
        if (confirm('Are you sure you want to logout?')) {
            window.location.href = '/';
        }
    };

    return (
        <AdminRoute>
            <AdminDataProvider>
                <div className="admin-panel">
                    <div className="admin-header">
                        <div className="admin-header-content">
                            <h1><Icon name="fa-shield-alt" /> Wular Sports Admin</h1>
                            <button className="btn-logout" onClick={handleLogout}>
                                <Icon name="fa-sign-out-alt" /> Logout
                            </button>
                        </div>
                    </div>

                    <div className="admin-body">
                        <div className="admin-sidebar">
                            <nav className="admin-nav">
                                {TABS.map(t => (
                                    <button
                                        key={t.id}
                                        className={`admin-nav-item ${activeTab === t.id ? 'active' : ''}`}
                                        onClick={() => setActiveTab(t.id)}
                                    >
                                        <Icon name={t.icon} />
                                        <span>{t.label}</span>
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div className="admin-content">
                            {activeTab === 'dashboard' && <AdminDashboard onNavigate={setActiveTab} />}
                            {activeTab === 'analytics' && <AnalyticsDashboard />}
                            {activeTab === 'marketing' && <MarketingDashboard />}
                            {activeTab === 'products' && <ProductsManagement />}
                            {activeTab === 'customers' && <CustomersManagement />}
                            {activeTab === 'orders' && <OrdersManagement />}
                            {activeTab === 'leads' && <LeadsManagement />}
                            {activeTab === 'reviews' && <ReviewsManagement />}
                            {activeTab === 'subscribers' && <SubscribersManagement />}
                        </div>
                    </div>
                </div>
            </AdminDataProvider>
        </AdminRoute>
    );
};
