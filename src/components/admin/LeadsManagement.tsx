import { FC, useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, limit, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { getFirestoreDb } from '../../services/firebase-firestore';
import { Icon } from '../common/Icon';

interface Lead {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    countryCode?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    cartSummary?: string;
    cartTotal?: number;
    status: 'browsing' | 'converted';
    updatedAt?: Date;
}

const fetchLeads = async (): Promise<Lead[]> => {
    const q = query(
        collection(getFirestoreDb(), 'leads'),
        orderBy('updatedAt', 'desc'),
        limit(1000)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => {
        const data = d.data();
        return {
            id: d.id,
            ...data,
            updatedAt: data.updatedAt?.toDate(),
        } as Lead;
    });
};

export const LeadsManagement: FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<'browsing' | 'converted' | 'all'>('browsing');

    const load = async () => {
        try {
            setLoading(true);
            setLeads(await fetchLeads());
            setError(null);
        } catch (err) {
            console.error('Failed to fetch leads:', err);
            setError('Failed to fetch leads — make sure the latest Firestore rules are published.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const filtered = useMemo(
        () => statusFilter === 'all' ? leads : leads.filter(l => l.status === statusFilter),
        [leads, statusFilter]
    );

    const whatsappLink = (lead: Lead): string | null => {
        if (!lead.phone) return null;
        const number = `${lead.countryCode || '+91'}${lead.phone}`.replace(/\D/g, '');
        const msg = encodeURIComponent(
            `Hi${lead.firstName ? ' ' + lead.firstName : ''}! This is Wular Sports 🏏 — noticed you were checking out${lead.cartSummary ? ` our ${lead.cartSummary}` : ' one of our bats'}. Happy to answer any questions or help you complete your order!`
        );
        return `https://wa.me/${number}?text=${msg}`;
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this lead?')) return;
        try {
            await deleteDoc(doc(getFirestoreDb(), 'leads', id));
            setLeads(prev => prev.filter(l => l.id !== id));
        } catch {
            alert('Failed to delete lead');
        }
    };

    if (loading) {
        return (
            <div className="admin-loading">
                <div className="loading-spinner"></div>
                <p>Loading leads...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-error">
                <p>{error}</p>
                <button className="btn" onClick={load}>Retry</button>
            </div>
        );
    }

    return (
        <div className="leads-management">
            <div className="management-header">
                <h1>Checkout Leads</h1>
                <p className="order-count">{filtered.length} leads</p>
            </div>

            <p className="dashboard-hint">
                💡 These visitors typed their details on checkout but haven't completed an order yet. A friendly WhatsApp message recovers many of them — tap the green button to start a pre-written chat.
            </p>

            <div className="orders-filters">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="status-filter"
                >
                    <option value="browsing">Needs Follow-up</option>
                    <option value="converted">Converted (ordered)</option>
                    <option value="all">All</option>
                </select>
                <button className="btn" onClick={load}><Icon name="fa-redo-alt" /> Refresh</button>
            </div>

            {filtered.length === 0 ? (
                <div className="empty-state">
                    <Icon name="fa-inbox" style={{ fontSize: '48px', color: '#666' }} />
                    <p>No leads here yet — they'll appear as soon as a visitor types their contact details at checkout.</p>
                </div>
            ) : (
                <div className="orders-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Last Active</th>
                                <th>Name</th>
                                <th>Contact</th>
                                <th>Location</th>
                                <th>Cart</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((lead) => (
                                <tr key={lead.id}>
                                    <td className="order-date">
                                        {lead.updatedAt ? lead.updatedAt.toLocaleString() : '—'}
                                    </td>
                                    <td>
                                        <strong>{[lead.firstName, lead.lastName].filter(Boolean).join(' ') || '—'}</strong>
                                    </td>
                                    <td>
                                        <div className="customer-cell">
                                            {lead.phone && <span>{lead.countryCode || '+91'} {lead.phone}</span>}
                                            {lead.email && <span className="customer-email">{lead.email}</span>}
                                        </div>
                                    </td>
                                    <td>
                                        {[lead.city, lead.state, lead.country].filter(Boolean).join(', ') || '—'}
                                    </td>
                                    <td>
                                        <div className="customer-cell">
                                            {lead.cartSummary && <span>{lead.cartSummary}</span>}
                                            {typeof lead.cartTotal === 'number' && lead.cartTotal > 0 && (
                                                <span className="order-total">₹{lead.cartTotal.toLocaleString('en-IN')}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${lead.status === 'converted' ? 'delivered' : 'pending'}`}>
                                            {lead.status === 'converted' ? 'ordered' : 'follow up'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {whatsappLink(lead) && (
                                                <a
                                                    href={whatsappLink(lead)!}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn-view"
                                                    title="Message on WhatsApp"
                                                    style={{ backgroundColor: '#25D366' }}
                                                >
                                                    <Icon name="fa-whatsapp" />
                                                </a>
                                            )}
                                            <button
                                                className="btn-view"
                                                onClick={() => handleDelete(lead.id)}
                                                title="Delete lead"
                                                style={{ backgroundColor: '#8b0000' }}
                                            >
                                                <Icon name="fa-times" />
                                            </button>
                                        </div>
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
