import { FC, useState, useEffect } from 'react';
import { getAllSubscribers, exportSubscribersCSV, Subscriber } from '../../services/admin';

export const SubscribersManagement: FC = () => {
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSubscribers();
    }, []);

    const fetchSubscribers = async () => {
        try {
            setLoading(true);
            const data = await getAllSubscribers();
            setSubscribers(data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch subscribers');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredSubscribers = subscribers.filter(sub =>
        sub.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleExport = () => {
        exportSubscribersCSV(filteredSubscribers);
    };

    if (loading) {
        return (
            <div className="admin-loading">
                <div className="loading-spinner"></div>
                <p>Loading subscribers...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-error">
                <p>{error}</p>
                <button className="btn" onClick={fetchSubscribers}>Retry</button>
            </div>
        );
    }

    return (
        <div className="subscribers-management">
            <div className="management-header">
                <h1>Newsletter Subscribers</h1>
                <p className="subscriber-count">{filteredSubscribers.length} subscribers</p>
            </div>

            <div className="subscribers-toolbar">
                <input
                    type="text"
                    placeholder="Search by email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />

                <button
                    className="btn btn-export"
                    onClick={handleExport}
                    disabled={filteredSubscribers.length === 0}
                >
                    <i className="fas fa-download"></i> Export to CSV
                </button>
            </div>

            {filteredSubscribers.length === 0 ? (
                <div className="empty-state">
                    <i className="fas fa-envelope" style={{ fontSize: '48px', color: '#666' }}></i>
                    <p>{searchTerm ? 'No subscribers found matching your search' : 'No subscribers yet'}</p>
                </div>
            ) : (
                <div className="subscribers-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Subscribed Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubscribers.map((subscriber) => (
                                <tr key={subscriber.id}>
                                    <td className="subscriber-email">{subscriber.email}</td>
                                    <td>
                                        <span className={`status-badge status-${subscriber.status}`}>
                                            {subscriber.status}
                                        </span>
                                    </td>
                                    <td className="subscriber-date">
                                        {subscriber.subscribedAt.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
