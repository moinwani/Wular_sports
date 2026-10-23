import { FC, useMemo, useState } from 'react';
import { useAdminData } from '../../hooks/useAdminData';
import { adminOrderEmails, describeEmail, EmailStatus } from '../../services/admin';
import { Customer, isPaid, toDate } from '../../services/customers';
import { templateById } from '../../services/whatsappTemplates';
import { ADMIN_EMAIL } from '../../data/constants';
import { inr, inrShort, daysAgo, pctChange } from './format';
import { Icon } from '../common/Icon';
import type { AdminTab } from '../../views/AdminView';

const DAY = 86400000;
const PERIOD_DAYS = 30;

const contactedWith = (c: Customer, template: string, sinceMs: number) =>
    (c.profile.contacts || []).some(x => x.template === template && new Date(x.at).getTime() >= sinceMs);

const contactedRecently = (c: Customer, days: number, now: number) => {
    const t = c.profile.lastContactedAt ? new Date(c.profile.lastContactedAt).getTime() : 0;
    return t > 0 && now - t < days * DAY;
};

interface ActionItem { c: Customer; detail: string; }

interface ActionCardProps {
    title: string;
    why: string;
    template: string;
    items: ActionItem[];
    tone: 'gold' | 'orange' | 'green' | 'blue' | 'purple';
    onSeeAll?: () => void;
    seeAllLabel?: string;
}

const ActionCard: FC<ActionCardProps> = ({ title, why, template, items, tone, onSeeAll, seeAllLabel }) => {
    const { contact } = useAdminData();
    const [done, setDone] = useState<Set<string>>(new Set());
    const shown = items.slice(0, 5);
    return (
        <section className={`today-card today-card--${tone}`}>
            <header>
                <h2>{title}</h2>
                <span className="today-card__count">{items.length}</span>
            </header>
            <p className="today-card__why">{why}</p>
            {items.length === 0 ? (
                <p className="today-card__empty">All clear 👍</p>
            ) : (
                <ul>
                    {shown.map(({ c, detail }) => (
                        <li key={c.key} className={done.has(c.key) ? 'done' : ''}>
                            <div>
                                <strong>{c.name}</strong>
                                <span>{detail}</span>
                            </div>
                            {c.phone && (
                                done.has(c.key)
                                    ? <span className="crm-ok"><Icon name="fa-check" /></span>
                                    : <button
                                        className="btn-view crm-wa-icon"
                                        title={`WhatsApp: ${templateById(template)?.label}`}
                                        aria-label={`WhatsApp ${c.name}`}
                                        onClick={() => { contact(c, template); setDone(prev => new Set(prev).add(c.key)); }}
                                    >
                                        <Icon name="fa-whatsapp" />
                                    </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            {onSeeAll && items.length > shown.length && (
                <button className="crm-linkbtn" onClick={onSeeAll}>{seeAllLabel || `See all ${items.length}`} →</button>
            )}
        </section>
    );
};

const Kpi: FC<{ label: string; value: string; cur: number; prev: number; hint?: string }> = ({ label, value, cur, prev, hint }) => {
    const delta = pctChange(cur, prev);
    return (
        <div className="today-kpi">
            <span className="today-kpi__label">{label}</span>
            <strong className="today-kpi__value">{value}</strong>
            <span className={`today-kpi__delta ${delta == null ? '' : delta >= 0 ? 'up' : 'down'}`}>
                {delta == null ? (hint || 'no earlier data') : `${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)}% vs previous ${PERIOD_DAYS} days`}
            </span>
        </div>
    );
};

export const AdminDashboard: FC<{ onNavigate: (tab: AdminTab) => void }> = ({ onNavigate }) => {
    const { orders, customers, loading, failed, refresh } = useAdminData();
    const [emailTest, setEmailTest] = useState<{ busy: boolean; emails?: EmailStatus; error?: string }>({ busy: false });
    const [now] = useState(() => Date.now());

    const kpis = useMemo(() => {
        const start = now - PERIOD_DAYS * DAY;
        const prevStart = now - 2 * PERIOD_DAYS * DAY;
        const paid = orders.filter(isPaid).map(o => ({ o, t: toDate(o.createdAt)?.getTime() || 0 }));
        const inRange = (a: number, b: number) => paid.filter(x => x.t >= a && x.t < b).map(x => x.o);
        const cur = inRange(start, now + 1), prev = inRange(prevStart, start);
        const rev = (list: any[]) => list.reduce((s, o) => s + (o.total || 0), 0);
        const firstOrders = customers.filter(c => c.firstOrderAt).map(c => c.firstOrderAt!.getTime());
        return {
            revenue: [rev(cur), rev(prev)],
            orders: [cur.length, prev.length],
            aov: [cur.length ? rev(cur) / cur.length : 0, prev.length ? rev(prev) / prev.length : 0],
            newCustomers: [firstOrders.filter(t => t >= start).length, firstOrders.filter(t => t >= prevStart && t < start).length],
            allTime: rev(paid.map(x => x.o)),
        };
    }, [orders, customers, now]);

    const actions = useMemo(() => {
        // 1. Paid orders waiting to be packed / shipped — oldest first
        const toShip = orders
            .filter(o => o.status === 'confirmed' || o.status === 'processing')
            .sort((a, b) => (toDate(a.createdAt)?.getTime() || 0) - (toDate(b.createdAt)?.getTime() || 0));
        const ownerOf = new Map<any, Customer>();
        customers.forEach(c => c.orders.forEach(o => ownerOf.set(o, c)));
        const shipItems: ActionItem[] = [];
        const seen = new Set<string>();
        for (const o of toShip) {
            const c = ownerOf.get(o);
            if (!c || seen.has(c.key)) continue;
            seen.add(c.key);
            const items = (o.items || []).map((i: any) => i.productName).join(', ');
            shipItems.push({ c, detail: `${items} · paid ${daysAgo(toDate(o.createdAt))}` });
        }

        // 2. Started checkout recently but didn't pay
        const recoverSince = now - 14 * DAY;
        const recover: ActionItem[] = customers
            .filter(c => c.phone && !contactedWith(c, 'checkout_recovery', recoverSince))
            .map(c => {
                const pending = c.orders.find(o => o.status === 'pending');
                const pendingT = toDate(pending?.createdAt)?.getTime() || 0;
                const leadT = c.lead && c.lead.status !== 'converted' ? toDate(c.lead.updatedAt)?.getTime() || 0 : 0;
                const t = Math.max(pendingT, leadT);
                const afterLastPaid = t > (c.lastOrderAt?.getTime() || 0);
                const what = c.lead?.cartSummary || pending?.items?.map((i: any) => i.productName).join(', ') || 'checkout';
                return { c, t, ok: t >= recoverSince && afterLastPaid, detail: `${what} · ${daysAgo(new Date(t))}` };
            })
            .filter(x => x.ok)
            .sort((a, b) => b.t - a.t)
            .map(({ c, detail }) => ({ c, detail }));

        // 3. Delivered in the last 60 days and not yet asked for a review
        const reviewSince = now - 60 * DAY;
        const reviews: ActionItem[] = customers
            .map(c => ({ c, o: c.orders.find(o => o.status === 'delivered' && (toDate(o.updatedAt || o.createdAt)?.getTime() || 0) >= reviewSince) }))
            .filter(x => x.o && !contactedWith(x.c, 'review_request', toDate(x.o.createdAt)?.getTime() || 0))
            .map(({ c, o }) => ({ c, detail: `${o.items?.[0]?.productName || 'bat'} · delivered ${daysAgo(toDate(o.updatedAt || o.createdAt))}` }));

        // 4. Lapsed buyers worth winning back — biggest spenders first
        const winBack: ActionItem[] = customers
            .filter(c => c.atRisk && c.segment !== 'Wholesale' && c.phone && !contactedRecently(c, 30, now))
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .map(c => ({ c, detail: `${inr(c.totalSpent)} spent · last order ${daysAgo(c.lastOrderAt)}` }));

        // 5. Wholesale partners due a check-in
        const wholesale: ActionItem[] = customers
            .filter(c => c.segment === 'Wholesale' && c.phone && !contactedRecently(c, 30, now) && (c.daysSinceLastOrder ?? 0) >= 30)
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .map(c => ({ c, detail: `${inrShort(c.totalSpent)} lifetime · last order ${daysAgo(c.lastOrderAt)}` }));

        return { shipItems, recover, reviews, winBack, wholesale };
    }, [orders, customers, now]);

    const codDue = orders.filter(o => isPaid(o) && o.paymentMethod === 'cod' && o.paymentStatus !== 'completed').length;

    const runEmailTest = async () => {
        setEmailTest({ busy: true });
        const result = await adminOrderEmails('test');
        setEmailTest({ busy: false, ...result });
    };

    if (loading && orders.length === 0) {
        return <div className="admin-loading"><div className="loading-spinner"></div><p>Loading your day…</p></div>;
    }

    return (
        <div className="admin-dashboard today">
            <div className="management-header">
                <h1>Today</h1>
                <p className="order-count">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>

            {failed.length > 0 && (
                <p className="dashboard-hint">⚠️ Couldn't load {failed.join(', ')}. <button className="crm-linkbtn" onClick={refresh}>Retry</button></p>
            )}

            <div className="today-kpis">
                <Kpi label={`Revenue · last ${PERIOD_DAYS} days`} value={inr(kpis.revenue[0])} cur={kpis.revenue[0]} prev={kpis.revenue[1]} />
                <Kpi label="Paid orders" value={String(kpis.orders[0])} cur={kpis.orders[0]} prev={kpis.orders[1]} />
                <Kpi label="Avg order value" value={kpis.aov[0] ? inr(kpis.aov[0]) : '—'} cur={kpis.aov[0]} prev={kpis.aov[1]} />
                <Kpi label="New customers" value={String(kpis.newCustomers[0])} cur={kpis.newCustomers[0]} prev={kpis.newCustomers[1]} />
                <div className="today-kpi">
                    <span className="today-kpi__label">All-time revenue</span>
                    <strong className="today-kpi__value">{inrShort(kpis.allTime)}</strong>
                    <span className="today-kpi__delta">{customers.filter(c => c.paidOrders > 0).length} paying customers</span>
                </div>
            </div>

            <h2 className="today-section-title">Your sales to-do list</h2>
            <div className="today-grid">
                <ActionCard
                    tone="gold"
                    title="Pack & ship"
                    why="Paid orders waiting to go out. Send a quick “being packed” message — it cuts “where is my order?” calls."
                    template="order_update"
                    items={actions.shipItems}
                    onSeeAll={() => onNavigate('orders')}
                    seeAllLabel="Open Orders"
                />
                <ActionCard
                    tone="orange"
                    title="Recover unfinished checkouts"
                    why="Started checkout in the last 14 days but didn't pay. A friendly message recovers many of these."
                    template="checkout_recovery"
                    items={actions.recover}
                    onSeeAll={() => onNavigate('customers')}
                />
                <ActionCard
                    tone="green"
                    title="Ask for reviews"
                    why="Delivered in the last 60 days and not asked yet. Reviews are your strongest sales tool."
                    template="review_request"
                    items={actions.reviews}
                    onSeeAll={() => onNavigate('customers')}
                />
                <ActionCard
                    tone="purple"
                    title="Win back past buyers"
                    why={`Bought before, nothing in 120+ days. Cheapest sale you'll make — they already trust you.`}
                    template="win_back"
                    items={actions.winBack}
                    onSeeAll={() => onNavigate('customers')}
                />
                <ActionCard
                    tone="blue"
                    title="Wholesale check-ins"
                    why="Bulk buyers who haven't ordered or heard from you in 30+ days."
                    template="wholesale"
                    items={actions.wholesale}
                    onSeeAll={() => onNavigate('customers')}
                />
            </div>

            <h2 className="today-section-title">Health checks</h2>
            <div className="today-health">
                <div className="email-health">
                    <div>
                        <strong>Order emails</strong>
                        <span>Sends a sample order email and a sample customer email to {ADMIN_EMAIL}.</span>
                    </div>
                    <button className="btn" onClick={runEmailTest} disabled={emailTest.busy}>
                        <Icon name="fa-envelope" /> {emailTest.busy ? 'Sending…' : 'Send test email'}
                    </button>
                    {emailTest.error && <p className="email-health__result bad">✗ {emailTest.error}</p>}
                    {emailTest.emails && (
                        <p className={`email-health__result ${emailTest.emails.admin === 'sent' && emailTest.emails.customer === 'sent' ? 'good' : 'bad'}`}>
                            Your order email: {describeEmail(emailTest.emails.admin)} · Customer email: {describeEmail(emailTest.emails.customer)}
                        </p>
                    )}
                </div>
                {codDue > 0 && (
                    <p className="dashboard-hint">
                        💰 <strong>{codDue} COD order{codDue > 1 ? 's' : ''}</strong> still have balance due at delivery. Mark payment “Completed” in Orders once the courier collects it.
                    </p>
                )}
            </div>
        </div>
    );
};
