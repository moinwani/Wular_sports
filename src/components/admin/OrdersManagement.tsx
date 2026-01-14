import { FC, useState, useMemo } from 'react';
import { useAllOrders } from '../../hooks/useOrders';
import { updateOrderStatus, updatePaymentStatus, searchOrders, filterOrdersByStatus } from '../../services/admin';

export const OrdersManagement: FC = () => {
    const { orders, loading, error } = useAllOrders();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [updating, setUpdating] = useState(false);

    const filteredOrders = useMemo(() => {
        let result = orders;
        result = filterOrdersByStatus(result, statusFilter);
        result = searchOrders(result, searchTerm);
        return result;
    }, [orders, statusFilter, searchTerm]);

    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        setUpdating(true);
        try {
            await updateOrderStatus(orderId, newStatus);
            alert('Order status updated successfully!');
        } catch (error) {
            alert('Failed to update order status');
            console.error(error);
        } finally {
            setUpdating(false);
        }
    };

    const handlePaymentUpdate = async (orderId: string, newPaymentStatus: string) => {
        setUpdating(true);
        try {
            await updatePaymentStatus(orderId, newPaymentStatus);
            alert('Payment status updated successfully!');
        } catch (error) {
            alert('Failed to update payment status');
            console.error(error);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-loading">
                <div className="loading-spinner"></div>
                <p>Loading orders...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-error">
                <p>Error loading orders: {error}</p>
            </div>
        );
    }

    return (
        <div className="orders-management">
            <div className="management-header">
                <h1>Orders Management</h1>
                <p className="order-count">{filteredOrders.length} orders</p>
            </div>

            <div className="orders-filters">
                <input
                    type="text"
                    placeholder="Search by customer name, email, or order number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="status-filter"
                >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            {filteredOrders.length === 0 ? (
                <div className="empty-state">
                    <i className="fas fa-inbox" style={{ fontSize: '48px', color: '#666' }}></i>
                    <p>No orders found</p>
                </div>
            ) : (
                <div className="orders-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Order #</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Payment</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order: any) => (
                                <tr key={order.id} onClick={() => setSelectedOrder(order)}>
                                    <td className="order-number">{order.orderNumber || order.id.slice(0, 8)}</td>
                                    <td>
                                        <div className="customer-cell">
                                            <strong>{order.customerName}</strong>
                                            <span className="customer-email">{order.customerEmail}</span>
                                        </div>
                                    </td>
                                    <td>{order.items?.length || 0} items</td>
                                    <td className="order-total">₹{order.total?.toLocaleString()}</td>
                                    <td>
                                        <select
                                            value={order.status}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                handleStatusUpdate(order.id, e.target.value);
                                            }}
                                            className={`status-select status-${order.status}`}
                                            disabled={updating}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="confirmed">Confirmed</option>
                                            <option value="processing">Processing</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </td>
                                    <td>
                                        <select
                                            value={order.paymentStatus}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                handlePaymentUpdate(order.id, e.target.value);
                                            }}
                                            className={`status-select payment-${order.paymentStatus}`}
                                            disabled={updating}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="completed">Completed</option>
                                            <option value="failed">Failed</option>
                                        </select>
                                    </td>
                                    <td className="order-date">
                                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td>
                                        <button
                                            className="btn-view"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedOrder(order);
                                            }}
                                        >
                                            <i className="fas fa-eye"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
                    <div className="modal-content order-details-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Order Details</h2>
                            <button className="modal-close" onClick={() => setSelectedOrder(null)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="order-detail-section">
                                <h3>Order Information</h3>
                                <p><strong>Order Number:</strong> {selectedOrder.orderNumber || selectedOrder.id}</p>
                                <p><strong>Date:</strong> {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : 'N/A'}</p>
                                <p><strong>Status:</strong> <span className={`status-badge status-${selectedOrder.status}`}>{selectedOrder.status}</span></p>
                                <p><strong>Payment Status:</strong> <span className={`status-badge payment-${selectedOrder.paymentStatus}`}>{selectedOrder.paymentStatus}</span></p>
                                <p><strong>Payment Method:</strong> {selectedOrder.paymentMethod}</p>
                            </div>

                            <div className="order-detail-section">
                                <h3>Customer Information</h3>
                                <p><strong>Name:</strong> {selectedOrder.customerName}</p>
                                <p><strong>Email:</strong> {selectedOrder.customerEmail}</p>
                                <p><strong>Phone:</strong> {selectedOrder.customerPhone}</p>
                                <p><strong>Address:</strong><br />
                                    {selectedOrder.customerAddress?.street}<br />
                                    {selectedOrder.customerAddress?.city}, {selectedOrder.customerAddress?.state} {selectedOrder.customerAddress?.pincode}
                                </p>
                            </div>

                            <div className="order-detail-section">
                                <h3>Items ({selectedOrder.items?.length || 0})</h3>
                                {selectedOrder.items?.map((item: any, index: number) => (
                                    <div key={index} className="order-item-row">
                                        <span>{item.productName} {item.size ? `(${item.size})` : ''}</span>
                                        <span>Qty: {item.quantity}</span>
                                        <span>₹{item.price?.toLocaleString()}</span>
                                    </div>
                                ))}
                                <div className="order-total-row">
                                    <strong>Total:</strong>
                                    <strong>₹{selectedOrder.total?.toLocaleString()}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
