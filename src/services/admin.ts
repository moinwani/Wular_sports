import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { getFirestoreDb } from './firebase-firestore';
import { updateDoc, doc } from 'firebase/firestore';
import type { CustomerProfileData } from './customers';
import type { Attribution, Campaign, CouponDef, SpendEntry } from '../lib/marketing';
import type { Category } from '../lib/catalog';
import type { ProductFull } from '../types';

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

export type EmailStatus = { admin?: string; customer?: string };

/**
 * Call the admin email tools endpoint (test email / confirm stuck order /
 * resend order emails). Requires the signed-in owner account.
 */
export const adminOrderEmails = (
    action: 'test' | 'confirm' | 'resend',
    orderId?: string
): Promise<{ emails?: EmailStatus; error?: string }> =>
    adminApi('/api/admin/order-emails', 'POST', { action, orderId });

/** Authenticated call to an admin-only API route as the signed-in owner. */
async function adminApi(path: string, method: 'GET' | 'POST', body?: unknown): Promise<any> {
    const { getCurrentUser } = await import('./auth');
    const user = getCurrentUser();
    if (!user) return { error: 'Not signed in' };
    const token = await user.getIdToken();
    const res = await fetch(path, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.error || `Request failed (${res.status})` };
    return data;
}

/** Tags, notes and contact history the owner keeps per customer. */
export const fetchCustomerProfiles = async (): Promise<Record<string, CustomerProfileData>> => {
    const data = await adminApi('/api/admin/customer-profiles', 'GET');
    if (data.error) throw new Error(data.error);
    return data.profiles || {};
};

export const saveCustomerProfile = (
    key: string,
    patch: { tags?: string[]; notes?: string; contact?: { template: string } }
): Promise<{ profile?: CustomerProfileData; error?: string }> =>
    adminApi('/api/admin/customer-profiles', 'POST', { key, ...patch });

export interface VisitorTrail {
    ref: string;
    attribution: Attribution | null;
    whatsappClicks: number;
    startedCheckout: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface MarketingData {
    campaigns: Campaign[];
    spend: SpendEntry[];
    coupons: CouponDef[];
    visitors: VisitorTrail[];
    metaConfigured: boolean;
}

export const fetchMarketing = async (): Promise<MarketingData> => {
    const data = await adminApi('/api/admin/marketing', 'GET');
    if (data.error) throw new Error(data.error);
    return data;
};

/** Run one marketing action (save campaign, record sale, …); returns { error } on failure. */
export const marketingAction = (action: string, payload: Record<string, unknown>): Promise<any> =>
    adminApi('/api/admin/marketing', 'POST', { action, ...payload });

/* ───────────── Products & categories ───────────── */

export interface AdminCatalog {
    products: ProductFull[];
    categories: Category[];
    /** false until the first change copies the built-in list into the database */
    managed: boolean;
    /** Photo storage (Vercel Blob) is connected */
    photosReady: boolean;
}

export const fetchAdminCatalog = async (): Promise<AdminCatalog> => {
    const data = await adminApi('/api/admin/products', 'GET');
    if (data.error) throw new Error(data.error);
    return data;
};

/** Save / delete / reorder products and categories; returns { error } on failure. */
export const productAction = (action: string, payload: Record<string, unknown>): Promise<any> =>
    adminApi('/api/admin/products', 'POST', { action, ...payload });

/** Shrink a photo in the browser (max 1600px, WebP or JPEG) so uploads are fast and pages stay light. */
async function shrinkPhoto(file: File): Promise<Blob> {
    const MAX = 1600;
    const bitmap = await createImageBitmap(file).catch(() => null);
    if (!bitmap) return file;
    const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const encode = (type: string) => new Promise<Blob | null>(r => canvas.toBlob(r, type, 0.85));
    const webp = await encode('image/webp');
    const out = webp && webp.type === 'image/webp' ? webp : await encode('image/jpeg');
    return out && out.size < file.size ? out : file;
}

/** Upload one product photo; returns its public address. */
export const uploadProductPhoto = async (file: File, productId: string): Promise<{ url?: string; error?: string }> => {
    const { getCurrentUser } = await import('./auth');
    const user = getCurrentUser();
    if (!user) return { error: 'Not signed in' };
    if (!file.type.startsWith('image/')) return { error: `${file.name} isn’t a photo` };
    const blob = await shrinkPhoto(file);
    const type = ['image/jpeg', 'image/png', 'image/webp'].includes(blob.type) ? blob.type : 'image/jpeg';
    const ext = type.split('/')[1].replace('jpeg', 'jpg');
    const name = file.name.replace(/\.[^.]+$/, '') + '.' + ext;
    const res = await fetch(`/api/admin/upload?product=${encodeURIComponent(productId || 'new')}&name=${encodeURIComponent(name)}`, {
        method: 'POST',
        headers: { 'Content-Type': type, Authorization: `Bearer ${await user.getIdToken()}` },
        body: blob,
    });
    const data = await res.json().catch(() => ({}));
    return res.ok ? { url: data.url } : { error: data.error || `Upload failed (${res.status})` };
};

/** Remove an uploaded photo that was never saved on a product. Best-effort. */
export const discardProductPhoto = async (url: string): Promise<void> => {
    try {
        const { getCurrentUser } = await import('./auth');
        const user = getCurrentUser();
        if (!user) return;
        await fetch('/api/admin/upload', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
            body: JSON.stringify({ url }),
        });
    } catch { /* best-effort */ }
};

/** Human-readable one-liner for an email status result */
export const describeEmail = (r?: string): string =>
    !r ? 'not sent yet' : r === 'sent' ? '✓ sent' : r === 'skipped' ? 'skipped (no customer email)' : `✗ ${r.replace(/^failed: /, 'failed — ')}`;
