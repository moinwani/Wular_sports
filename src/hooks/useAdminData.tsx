import { createContext, FC, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { getFirestoreDb } from '../services/firebase-firestore';
import { useAllOrders } from './useOrders';
import { getAllSubscribers, fetchCustomerProfiles, saveCustomerProfile, fetchMarketing, MarketingData } from '../services/admin';
import { getAllReviews } from '../services/reviews';
import { buildCustomers, Customer, CustomerProfileData, whatsappLink } from '../services/customers';
import { templateById } from '../services/whatsappTemplates';
import { attributeOrders, AttributedOrder } from '../services/marketing';
import { RecordSaleModal, SaleDraft } from '../components/admin/RecordSaleModal';

/**
 * One shared data source for the admin panel: live orders plus leads,
 * subscribers, reviews, the owner's customer notes and marketing data — loaded once and
 * shared by every tab, so Customers, Dashboard and Analytics always agree.
 */

interface AdminData {
    orders: any[];
    leads: any[];
    subscribers: any[];
    reviews: any[];
    customers: Customer[];
    loading: boolean;
    /** Sources that failed to load, e.g. ['leads'] — shown as a warning */
    failed: string[];
    refresh: () => void;
    saveProfile: (key: string, patch: { tags?: string[]; notes?: string }) => Promise<string | null>;
    /** Open WhatsApp with a message and log the contact against the customer */
    contact: (c: Customer, templateId: string, message?: string) => void;
    /** Campaigns, ad spend, coupons and website visitor trails */
    marketing: MarketingData;
    setMarketing: (update: (m: MarketingData) => MarketingData) => void;
    /** Every paid order with the source / campaign it is credited to */
    attributed: AttributedOrder[];
    /** Open the "Record a WhatsApp sale" form, optionally pre-filled */
    openRecordSale: (draft?: SaleDraft) => void;
}

const EMPTY_MARKETING: MarketingData = { campaigns: [], spend: [], coupons: [], visitors: [], metaConfigured: false };

const Ctx = createContext<AdminData | null>(null);

const fetchLeads = async () => {
    const snap = await getDocs(query(collection(getFirestoreDb(), 'leads'), orderBy('updatedAt', 'desc'), limit(1000)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const AdminDataProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const { orders, loading: ordersLoading } = useAllOrders();
    const [leads, setLeads] = useState<any[]>([]);
    const [subscribers, setSubscribers] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [profiles, setProfiles] = useState<Record<string, CustomerProfileData>>({});
    const [extraLoading, setExtraLoading] = useState(true);
    const [failed, setFailed] = useState<string[]>([]);
    const [version, setVersion] = useState(0);
    const [marketing, setMarketingState] = useState<MarketingData>(EMPTY_MARKETING);
    const [saleDraft, setSaleDraft] = useState<SaleDraft | null>(null);

    useEffect(() => {
        let cancelled = false;
        setExtraLoading(true);
        const errors: string[] = [];
        const settle = <T,>(name: string, p: Promise<T>, set: (v: T) => void) =>
            p.then(v => { if (!cancelled) set(v); }).catch(err => {
                console.error(`Admin data: failed to load ${name}`, err);
                errors.push(name);
            });
        Promise.all([
            settle('leads', fetchLeads(), setLeads),
            settle('subscribers', getAllSubscribers(), setSubscribers),
            settle('reviews', getAllReviews(), setReviews),
            settle('customer notes', fetchCustomerProfiles(), setProfiles),
            settle('marketing', fetchMarketing(), setMarketingState),
        ]).finally(() => {
            if (cancelled) return;
            setFailed(errors);
            setExtraLoading(false);
        });
        return () => { cancelled = true; };
    }, [version]);

    const customers = useMemo(
        () => buildCustomers(orders, leads, subscribers, profiles),
        [orders, leads, subscribers, profiles]
    );

    const attributed = useMemo(
        () => attributeOrders(orders, marketing.campaigns),
        [orders, marketing.campaigns]
    );

    const setMarketing = useCallback((update: (m: MarketingData) => MarketingData) => setMarketingState(update), []);
    const openRecordSale = useCallback((draft?: SaleDraft) => setSaleDraft(draft || {}), []);

    const saveProfile = useCallback(async (key: string, patch: { tags?: string[]; notes?: string }) => {
        const res = await saveCustomerProfile(key, patch);
        if (res.error) return res.error;
        if (res.profile) setProfiles(p => ({ ...p, [key]: res.profile! }));
        return null;
    }, []);

    const contact = useCallback((c: Customer, templateId: string, message?: string) => {
        const text = message ?? templateById(templateId)?.build(c) ?? '';
        const link = whatsappLink(c.phone, text);
        if (!link) return;
        window.open(link, '_blank', 'noopener,noreferrer');
        // Log in the background; the WhatsApp tab is already open
        saveCustomerProfile(c.key, { contact: { template: templateId } }).then(res => {
            if (res.profile) setProfiles(p => ({ ...p, [c.key]: res.profile! }));
        });
    }, []);

    const value = useMemo<AdminData>(() => ({
        orders, leads, subscribers, reviews, customers,
        loading: ordersLoading || extraLoading,
        failed,
        refresh: () => setVersion(v => v + 1),
        saveProfile,
        contact,
        marketing,
        setMarketing,
        attributed,
        openRecordSale,
    }), [orders, leads, subscribers, reviews, customers, ordersLoading, extraLoading, failed, saveProfile, contact, marketing, setMarketing, attributed, openRecordSale]);

    return (
        <Ctx.Provider value={value}>
            {children}
            {saleDraft && <RecordSaleModal draft={saleDraft} onClose={() => setSaleDraft(null)} />}
        </Ctx.Provider>
    );
};

export const useAdminData = (): AdminData => {
    const v = useContext(Ctx);
    if (!v) throw new Error('useAdminData must be used inside AdminDataProvider');
    return v;
};
