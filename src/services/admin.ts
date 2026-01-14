import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db } from './firebase';
import { updateDoc, doc } from 'firebase/firestore';

/**
 * Admin Service
 * Functions for admin panel operations
 */

export interface Subscriber {
    id: string;
    email: string;
    status: string;
    subscribedAt: Date;
}

export interface OrderAnalytics {
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    totalSubscribers: number;
    recentOrders: any[];
}

/**
 * Fetch all subscribers from Firestore
 * Admin only - requires admin custom claim
 */
export const getAllSubscribers = async (): Promise<Subscriber[]> => {
    try {
        const q = query(collection(db, 'subscribers'), orderBy('subscribedAt', 'desc'));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            email: doc.data().email,
            status: doc.data().status,
            subscribedAt: doc.data().subscribedAt?.toDate() || new Date()
        }));
    } catch (error) {
        console.error('Error fetching subscribers:', error);
        throw error;
    }
};

/**
 * Update order status
 * Admin only
 */
export const updateOrderStatus = async (
    orderId: string,
    status: string
): Promise<void> => {
    try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
            status: status,
            updatedAt: new Date()
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        throw error;
    }
};

/**
 * Update payment status
 * Admin only
 */
export const updatePaymentStatus = async (
    orderId: string,
    paymentStatus: string,
    paymentId?: string
): Promise<void> => {
    try {
        const orderRef = doc(db, 'orders', orderId);
        const updateData: any = {
            paymentStatus: paymentStatus,
            updatedAt: new Date()
        };

        if (paymentId) {
            updateData.paymentId = paymentId;
        }

        await updateDoc(orderRef, updateData);
    } catch (error) {
        console.error('Error updating payment status:', error);
        throw error;
    }
};

/**
 * Calculate order analytics
 */
export const getOrderAnalytics = (orders: any[]): OrderAnalytics => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const recentOrders = orders.slice(0, 5); // Latest 5 orders

    return {
        totalOrders,
        totalRevenue,
        pendingOrders,
        totalSubscribers: 0, // Will be updated by component
        recentOrders
    };
};

/**
 * Export subscribers to CSV
 */
export const exportSubscribersCSV = (subscribers: Subscriber[]): void => {
    const csvHeader = 'Email,Status,Subscribed Date\n';
    const csvRows = subscribers.map(sub =>
        `${sub.email},${sub.status},${sub.subscribedAt.toLocaleString()}`
    ).join('\n');

    const csvContent = csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `wular-sports-subscribers-${Date.now()}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Search orders by customer name or email
 */
export const searchOrders = (orders: any[], searchTerm: string): any[] => {
    if (!searchTerm) return orders;

    const term = searchTerm.toLowerCase();
    return orders.filter(order =>
        order.customerName?.toLowerCase().includes(term) ||
        order.customerEmail?.toLowerCase().includes(term) ||
        order.orderNumber?.toLowerCase().includes(term)
    );
};

/**
 * Filter orders by status
 */
export const filterOrdersByStatus = (orders: any[], status: string): any[] => {
    if (status === 'all') return orders;
    return orders.filter(order => order.status === status);
};
