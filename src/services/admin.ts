import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { getFirestoreDb } from './firebase-firestore';
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
    paidOrders: number;
    totalRevenue: number;
    monthRevenue: number;
    needsAction: number;
    abandonedCheckouts: number;
    codPending: number;
    totalSubscribers: number;
    recentOrders: any[];
}

/**
 * Fetch all subscribers from Firestore
 * Admin only - requires admin custom claim
 */
export const getAllSubscribers = async (): Promise<Subscriber[]> => {
    try {
        // Firestore rules only allow subscriber list queries that carry an
        // explicit limit (<= 1000) — without it the query is denied.
        const q = query(
            collection(getFirestoreDb(), 'subscribers'),
            orderBy('subscribedAt', 'desc'),
            limit(1000)
        );
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
        const orderRef = doc(getFirestoreDb(), 'orders', orderId);
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
        const orderRef = doc(getFirestoreDb(), 'orders', orderId);
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
 * Calculate order analytics.
 *
 * Order lifecycle: 'pending' means the checkout was started but payment was
 * never completed (an abandoned checkout — a follow-up lead, NOT revenue).
 * Anything from 'confirmed' onwards is a real, paid order.
 */
export const getOrderAnalytics = (orders: any[]): OrderAnalytics => {
    const isPaid = (o: any) =>
        ['confirmed', 'processing', 'shipped', 'delivered'].includes(o.status);

    const paid = orders.filter(isPaid);
    const totalRevenue = paid.reduce((sum, o) => sum + (o.total || 0), 0);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthRevenue = paid
        .filter(o => o.createdAt && new Date(o.createdAt) >= monthStart)
        .reduce((sum, o) => sum + (o.total || 0), 0);

    // Paid orders waiting to be packed / shipped
    const needsAction = orders.filter(o =>
        o.status === 'confirmed' || o.status === 'processing'
    ).length;

    // Checkouts started but never paid — call these customers on WhatsApp!
    const abandonedCheckouts = orders.filter(o => o.status === 'pending').length;

    // COD orders where the balance is still due at the door
    const codPending = orders.filter(o =>
        isPaid(o) && o.paymentMethod === 'cod' && o.paymentStatus !== 'completed'
    ).length;

    return {
        totalOrders: orders.length,
        paidOrders: paid.length,
        totalRevenue,
        monthRevenue,
        needsAction,
        abandonedCheckouts,
        codPending,
        totalSubscribers: 0, // Will be updated by component
        recentOrders: orders.slice(0, 5)
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
