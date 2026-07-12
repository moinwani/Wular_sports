import { FC, useState } from 'react';
import { AdminRoute } from '../components/admin/AdminRoute';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { OrdersManagement } from '../components/admin/OrdersManagement';
import { SubscribersManagement } from '../components/admin/SubscribersManagement';
import { LeadsManagement } from '../components/admin/LeadsManagement';
import { Icon } from '../components/common/Icon';

type AdminTab = 'dashboard' | 'orders' | 'leads' | 'subscribers';

export const AdminView: FC = () => {
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

    const handleLogout = () => {
        if (confirm('Are you sure you want to logout?')) {
            window.location.href = '/';
        }
    };

    return (
        <AdminRoute>
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
                            <button
                                className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                                onClick={() => setActiveTab('dashboard')}
                            >
                                <Icon name="fa-chart-line" />
                                <span>Dashboard</span>
                            </button>
                            <button
                                className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                                onClick={() => setActiveTab('orders')}
                            >
                                <Icon name="fa-shopping-cart" />
                                <span>Orders</span>
                            </button>
                            <button
                                className={`admin-nav-item ${activeTab === 'leads' ? 'active' : ''}`}
                                onClick={() => setActiveTab('leads')}
                            >
                                <Icon name="fa-user-circle" />
                                <span>Leads</span>
                            </button>
                            <button
                                className={`admin-nav-item ${activeTab === 'subscribers' ? 'active' : ''}`}
                                onClick={() => setActiveTab('subscribers')}
                            >
                                <Icon name="fa-envelope" />
                                <span>Subscribers</span>
                            </button>
                        </nav>
                    </div>

                    <div className="admin-content">
                        {activeTab === 'dashboard' && <AdminDashboard />}
                        {activeTab === 'orders' && <OrdersManagement />}
                        {activeTab === 'leads' && <LeadsManagement />}
                        {activeTab === 'subscribers' && <SubscribersManagement />}
                    </div>
                </div>
            </div>
        </AdminRoute>
    );
};
