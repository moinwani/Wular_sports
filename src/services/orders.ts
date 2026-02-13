import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp,
    DocumentData
} from 'firebase/firestore';
import { db } from './firebase';

export interface Order {
    id?: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress: {
        street: string;
        city: string;
        state: string;
        pincode: string;
    };
    items: Array<{
        productId: string;
        productName: string;
        price: number;
        quantity: number;
        size?: string;
    }>;
    total: number;
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    paymentStatus: 'pending' | 'completed' | 'failed';
    paymentMethod?: string;
    paymentId?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ORDERS_COLLECTION = 'orders';

/**
 * Generate a unique order number
 */
const generateOrderNumber = (): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `WS${timestamp}${random}`;
};

/**
 * Create a new order
 */
export const createOrder = async (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
        const order: Omit<Order, 'id'> = {
            ...orderData,
            orderNumber: generateOrderNumber(),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
            ...order,
            createdAt: Timestamp.fromDate(order.createdAt),
            updatedAt: Timestamp.fromDate(order.updatedAt)
        });


        return docRef.id;
    } catch (error) {
        console.error('Error creating order:', error);
        throw new Error('Failed to create order');
    }
};

/**
 * Get order by ID
 */
export const getOrder = async (orderId: string): Promise<Order | null> => {
    try {
        const docRef = doc(db, ORDERS_COLLECTION, orderId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate()
            } as Order;
        }

        return null;
    } catch (error) {
        console.error('Error getting order:', error);
        throw new Error('Failed to get order');
    }
};

/**
 * Get all orders (admin use)
 */
export const getAllOrders = async (): Promise<Order[]> => {
    try {
        const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate()
            } as Order;
        });
    } catch (error) {
        console.error('Error getting orders:', error);
        throw new Error('Failed to get orders');
    }
};

/**
 * Get orders by customer email
 */
export const getOrdersByEmail = async (email: string): Promise<Order[]> => {
    try {
        const q = query(
            collection(db, ORDERS_COLLECTION),
            where('customerEmail', '==', email),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate()
            } as Order;
        });
    } catch (error) {
        console.error('Error getting orders by email:', error);
        throw new Error('Failed to get orders');
    }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (
    orderId: string,
    status: Order['status']
): Promise<void> => {
    try {
        const docRef = doc(db, ORDERS_COLLECTION, orderId);
        await updateDoc(docRef, {
            status,
            updatedAt: Timestamp.fromDate(new Date())
        });

    } catch (error) {
        console.error('Error updating order status:', error);
        throw new Error('Failed to update order status');
    }
};

/**
 * Update payment status
 */
export const updatePaymentStatus = async (
    orderId: string,
    paymentStatus: Order['paymentStatus'],
    paymentId?: string
): Promise<void> => {
    try {
        const docRef = doc(db, ORDERS_COLLECTION, orderId);
        const updateData: DocumentData = {
            paymentStatus,
            updatedAt: Timestamp.fromDate(new Date())
        };

        if (paymentId) {
            updateData.paymentId = paymentId;
        }

        await updateDoc(docRef, updateData);

    } catch (error) {
        console.error('Error updating payment status:', error);
        throw new Error('Failed to update payment status');
    }
};

/**
 * Delete order (admin use)
 */
export const deleteOrder = async (orderId: string): Promise<void> => {
    try {
        const docRef = doc(db, ORDERS_COLLECTION, orderId);
        await deleteDoc(docRef);

    } catch (error) {
        console.error('Error deleting order:', error);
        throw new Error('Failed to delete order');
    }
};
