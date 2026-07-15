import { FC, useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { getFirestoreDb } from '../../services/firebase-firestore';
import { useAllOrders } from '../../hooks/useOrders';
import { getAllReviews } from '../../services/reviews';
import {
    computeKpis, computeCheckoutFunnel, computeCohorts, computeRfm,
    computeCoupon, computeProducts, computeLeadPipeline,
} from '../../services/analytics';
import { Icon } from '../common/Icon';

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
const lakh = (n: number) => n >= 100000 ? '₹' + (n / 100000).toFixed(2) + 'L' : inr(n);

export const AnalyticsDashboard: FC = () => {
    const { orders, loading } = useAllOrders();
    const [leads, setLeads] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);

    useEffect(() => {
        (async () => {
            try {
                const snap = await getDocs(query(collection(getFirestoreDb(), 'leads'), orderBy('updatedAt', 'desc'), limit(1000)));
                setLeads(snap.docs.map(d => d.data()));
            } catch { /* rules / empty */ }
            try { setReviews(await getAllReviews()); } catch { /* empty */ }
        })();
    }, []);

    const m = useMemo(() => ({
        kpis: computeKpis(orders),
        funnel: computeCheckoutFunnel(orders, leads),
        cohorts: computeCohorts(orders),
        rfm: computeRfm(orders),
        coupon: computeCoupon(orders),
        products: computeProducts(orders, reviews),
        pipeline: computeLeadPipeline(leads),
    }), [orders, leads, reviews]);

    if (loading) {
        return (
            <div className="admin-loading">
                <div className="loading-spinner"></div>
                <p>Crunching your store data…</p>
            </div>
        );
    }

    if (m.kpis.paidOrders === 0 && orders.length === 0) {
        return (
            <div className="analytics-dash">
                <h1>Analytics</h1>
                <div className="empty-state">
                    <Icon name="fa-chart-line" style={{ fontSize: '48px', color: '#666' }} />
                    <p>No orders yet — your live metrics will appear here as soon as sales come in.</p>
                </div>
            </div>
        );
    }

    const chMax = Math.max(...m.products.map(p => p.revenue), 1);
    const funnelTop = Math.max(...m.funnel.map(f => f.count), 1);

    return (
        <div className="analytics-dash">
            <div className="management-header">
                <h1>Analytics</h1>
                <p className="order-count">Live from your store</p>
            </div>

            {/* KPI strip */}
            <div className="an-kpis">
                <div className="an-kpi"><span className="k-lab">Paid Revenue</span><span className="k-val gold">{lakh(m.kpis.paidRevenue)}</span><span className="k-foot">{inr(m.kpis.paidRevenue)}</span></div>
                <div className="an-kpi"><span className="k-lab">Paid Orders</span><span className="k-val">{m.kpis.paidOrders}</span><span className="k-foot">{m.kpis.uniqueCustomers} customers</span></div>
                <div className="an-kpi"><span className="k-lab">Avg Order Value</span><span className="k-val">{inr(m.kpis.avgOrderValue)}</span><span className="k-foot">{m.kpis.ordersPerCustomer} orders/customer</span></div>
                <div className="an-kpi"><span className="k-lab">Abandoned</span><span className="k-val">{m.kpis.abandoned}</span><span className="k-foot warn">recoverable leads</span></div>
            </div>

            <div className="an-grid">
                {/* Checkout funnel */}
                <section className="an-panel wide">
                    <div className="an-head"><h2>Checkout funnel</h2><span className="an-note">leads → checkout → paid</span></div>
                    <div className="an-funnel">
                        {m.funnel.map(f => (
                            <div className="an-fstep" key={f.step}>
                                <span className="an-fl">{f.step}</span>
                                <div className="an-fwrap">
                                    <div className={`an-fbar ${f.step === 'Paid' ? 'good' : ''}`} style={{ width: `${Math.max(100 * f.count / funnelTop, 6)}%` }}>
                                        <span className="an-fu">{f.count.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                                <span className="an-fconv">{f.stepConv != null ? `${f.stepConv}%` : ''}</span>
                            </div>
                        ))}
                    </div>
                    <p className="an-hint">Visitor-level funnel (page views → cart) lives in GA4. This is the checkout funnel from your database.</p>
                </section>

                {/* RFM */}
                <section className="an-panel">
                    <div className="an-head"><h2>Customer segments</h2><span className="an-note">RFM</span></div>
                    {m.rfm.length ? m.rfm.map(s => (
                        <div className={`an-seg ${s.tone}`} key={s.segment}>
                            <span className="an-sn">{s.segment}</span>
                            <span className="an-sc">{s.customers}</span>
                            <span className="an-sm">avg {s.avgOrders} orders · {inr(s.avgSpend)}</span>
                        </div>
                    )) : <p className="an-empty">Needs a few paid orders.</p>}
                </section>

                {/* Cohorts */}
                <section className="an-panel">
                    <div className="an-head"><h2>Repeat customers</h2><span className="an-note">by cohort month</span></div>
                    {m.cohorts.length ? m.cohorts.map(c => (
                        <div className="an-row" key={c.cohort}>
                            <span className="an-rl mono">{c.cohort}</span>
                            <div className="an-track"><div className="an-fill" style={{ width: `${c.repeatRate}%` }}></div></div>
                            <span className="an-rv">{c.repeatRate}% <small>· {c.customers}</small></span>
                        </div>
                    )) : <p className="an-empty">Needs repeat purchase history.</p>}
                </section>

                {/* Coupon */}
                <section className="an-panel">
                    <div className="an-head"><h2>Coupon impact</h2><span className="an-note">WELCOME100</span></div>
                    {m.coupon.length ? m.coupon.map(c => (
                        <div className="an-ccrow" key={c.segment}>
                            <span className="an-cn">{c.segment}</span>
                            <span className="an-cbig mono">{c.orders}</span>
                            <span className="an-csm">AOV<br />{inr(c.avgOrderValue)}</span>
                            <span className="an-csm">cart<br />{inr(c.avgCart)}</span>
                        </div>
                    )) : <p className="an-empty">No paid orders yet.</p>}
                </section>

                {/* Lead pipeline */}
                <section className="an-panel">
                    <div className="an-head"><h2>Lead pipeline</h2><span className="an-note">follow-up</span></div>
                    <div className="an-pipe">
                        <div className="an-pstat"><span className="p-v">{lakh(m.pipeline.openPipelineValue)}</span><span className="p-l">open pipeline</span></div>
                        <div className="an-pstat"><span className="p-v">{m.pipeline.reachableOpen}</span><span className="p-l">reachable leads</span></div>
                        <div className="an-pstat"><span className="p-v">{m.pipeline.conversionRate}%</span><span className="p-l">lead conversion</span></div>
                        <div className="an-pstat"><span className="p-v">{m.pipeline.tappedWhatsApp}</span><span className="p-l">tapped WhatsApp</span></div>
                    </div>
                </section>

                {/* Products */}
                <section className="an-panel wide">
                    <div className="an-head"><h2>Product performance</h2><span className="an-note">units · revenue · rating</span></div>
                    <div className="scroll">
                        <table className="admin-table">
                            <thead><tr><th>Product</th><th>Units</th><th>Revenue</th><th>Rating</th><th>Reviews</th></tr></thead>
                            <tbody>
                                {m.products.length ? m.products.map(p => (
                                    <tr key={p.product}>
                                        <td>{p.product}</td>
                                        <td>{p.units}</td>
                                        <td>{inr(p.revenue)}</td>
                                        <td>{p.avgRating != null ? <><span style={{ color: 'var(--golden)' }}>{'★'.repeat(Math.round(p.avgRating))}</span> {p.avgRating.toFixed(2)}</> : '—'}</td>
                                        <td>{p.reviews}</td>
                                    </tr>
                                )) : <tr><td colSpan={5}>No paid orders yet.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
};
