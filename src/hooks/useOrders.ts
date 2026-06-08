import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { getFirestoreDb } from '../services/firebase-firestore';
import { Order } from '../services/orders';

/**
 * Hook to get orders by customer email with real-time updates
 */
export const useOrders = (customerEmail?: string) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!customerEmail) {
            setOrders([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const q = query(
            collection(getFirestoreDb(), 'orders'),
            where('customerEmail', '==', customerEmail),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(
            q,
            (querySnapshot: QuerySnapshot<DocumentData>) => {
                const ordersData: Order[] = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        createdAt: data.createdAt?.toDate(),
                        updatedAt: data.updatedAt?.toDate()
                    } as Order;
                });

                setOrders(ordersData);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching orders:', err);
                setError('Failed to fetch orders');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [customerEmail]);

    return { orders, loading, error };
};

/**
 * Hook to get all orders (admin use ONLY) with real-time updates
 * SECURITY: Only accessible to users with admin custom claim
 */
export const useAllOrders = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        setLoading(true);
        setError(null);

        // SECURITY: Check if user is admin before fetching all orders
        const checkAuthAndFetch = async () => {
            try {
                const { isAdmin } = await import('../services/auth');
                const adminStatus = await isAdmin();

                if (!adminStatus) {
                    setError('Unauthorized: Admin access required');
                    setLoading(false);
                    setIsAuthorized(false);
                    return;
                }

                setIsAuthorized(true);

                // Only fetch orders if admin
                const q = query(
                    collection(getFirestoreDb(), 'orders'),
                    orderBy('createdAt', 'desc')
                );

                const unsubscribe = onSnapshot(
                    q,
                    (querySnapshot: QuerySnapshot<DocumentData>) => {
                        const ordersData: Order[] = querySnapshot.docs.map(doc => {
                            const data = doc.data();
                            return {
                                id: doc.id,
                                ...data,
                                createdAt: data.createdAt?.toDate(),
                                updatedAt: data.updatedAt?.toDate()
                            } as Order;
                        });

                        setOrders(ordersData);
                        setLoading(false);
                    },
                    (err) => {
                        console.error('Error fetching all orders:', err);
                        setError('Failed to fetch orders');
                        setLoading(false);
                    }
                );

                return unsubscribe;
            } catch (err) {
                console.error('Error checking admin status:', err);
                setError('Authentication error');
                setLoading(false);
            }
        };

        const unsubscribePromise = checkAuthAndFetch();

        return () => {
            unsubscribePromise?.then(unsub => unsub?.());
        };
    }, []);

    return { orders, loading, error, isAuthorized };
};
