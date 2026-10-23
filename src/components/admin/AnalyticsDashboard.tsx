import { FC, useMemo, useState } from 'react';
import { useAdminData } from '../../hooks/useAdminData';
import {
    RANGES, RangeId, rangeWindow, inWindow, computeRangeKpis, revenueSeries,
    salesByState, paymentSplit, channelSplit, firstVsRepeat, segmentSummary,
    checkoutConversion, computeCohorts, computeCoupon, computeProducts, computeLeadPipeline,
} from '../../services/analytics';
import { ColumnChart, BarList, SplitBar } from './charts';
import { inr, inrShort, pctChange } from './format';
import { Icon } from '../common/Icon';

const Tile: FC<{ label: string; value: string; cur: number; prev: number | null; compareLabel: string }> = ({ label, value, cur, prev, compareLabel }) => {
    const delta = prev == null ? null : pctChange(cur, prev);
    return (
        <div className="today-kpi">
            <span className="today-kpi__label">{label}</span>
            <strong className="today-kpi__value">{value}</strong>
            {prev != null && (
                <span className={`today-kpi__delta ${delta == null ? '' : delta >= 0 ? 'up' : 'down'}`}>
                    {delta == null ? 'no earlier data' : `${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)}% vs ${compareLabel}`}
                </span>
            )}
        </div>
    );
};

export const AnalyticsDashboard: FC = () => {
    const { orders, leads, reviews, customers, loading } = useAdminData();
    const [range, setRange] = useState<RangeId>('90d');
    const [now] = useState(() => Date.now());

    const m = useMemo(() => {
        const win = rangeWindow(range, now);
        const cur = inWindow(orders, win.start, win.end);
        const prev = win.prevStart == null ? null : inWindow(orders, win.prevStart, win.start);
        return {
            win,
            kpis: computeRangeKpis(cur),
            prevKpis: prev ? computeRangeKpis(prev) : null,
            series: revenueSeries(cur, win, now),
            states: salesByState(cur),
            payment: paymentSplit(cur),
            channel: channelSplit(cur),
            newRet: firstVsRepeat(cur, customers),
            products: computeProducts(cur, reviews),
            checkout: checkoutConversion(cur),
            coupon: computeCoupon(cur),
            segments: segmentSummary(customers),
            cohorts: computeCohorts(orders),
            pipeline: computeLeadPipeline(leads),
        };
    }, [orders, leads, reviews, customers, range, now]);

    if (loading && orders.length === 0) {
        return <div className="admin-loading"><div className="loading-spinner"></div><p>Crunching your store data…</p></div>;
    }

    if (orders.length === 0) {
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

    const rangeLabel = RANGES.find(r => r.id === range)!.label.toLowerCase();
    const compareLabel = `previous ${m.win.days} days`;
    const p = m.prevKpis;

    return (
        <div className="analytics-dash">
            <div className="management-header">
                <h1>Analytics</h1>
                <p className="order-count">Live from your store</p>
            </div>

            <div className="an-filters" role="radiogroup" aria-label="Date range">
                {RANGES.map(r => (
                    <button
                        key={r.id}
                        role="radio"
                        aria-checked={range === r.id}
                        className={`crm-chip ${range === r.id ? 'active' : ''}`}
                        onClick={() => setRange(r.id)}
                    >
                        {range === r.id && <Icon name="fa-check" />} {r.label}
                    </button>
                ))}
            </div>

            <div className="today-kpis">
                <Tile label="Revenue" value={inr(m.kpis.revenue)} cur={m.kpis.revenue} prev={p?.revenue ?? null} compareLabel={compareLabel} />
                <Tile label="Paid orders" value={String(m.kpis.orders)} cur={m.kpis.orders} prev={p?.orders ?? null} compareLabel={compareLabel} />
                <Tile label="Avg order value" value={m.kpis.aov ? inr(m.kpis.aov) : '—'} cur={m.kpis.aov} prev={p?.aov ?? null} compareLabel={compareLabel} />
                <Tile label="Customers" value={String(m.kpis.customers)} cur={m.kpis.customers} prev={p?.customers ?? null} compareLabel={compareLabel} />
                <Tile label="Bats sold" value={String(m.kpis.bats)} cur={m.kpis.bats} prev={p?.bats ?? null} compareLabel={compareLabel} />
            </div>

            <div className="an-grid">
                <section className="an-panel wide">
                    <div className="an-head"><h2>Revenue over time</h2><span className="an-note">paid orders · {rangeLabel}</span></div>
                    <ColumnChart
                        data={m.series.map(s => ({ label: s.label, tooltipLabel: s.tooltipLabel, value: s.revenue, detail: `${s.orders} order${s.orders === 1 ? '' : 's'}` }))}
                        format={inr}
                        axisFormat={inrShort}
                        ariaLabel={`Revenue over time, ${rangeLabel}`}
                        valueName="Revenue"
                    />
                </section>

                <section className="an-panel">
                    <div className="an-head"><h2>Where your buyers are</h2><span className="an-note">revenue by state</span></div>
                    <BarList rows={m.states} format={inrShort} ariaLabel="Revenue by state" />
                </section>

                <section className="an-panel an-splits">
                    <div className="an-head"><h2>Sales mix</h2><span className="an-note">{rangeLabel}</span></div>
                    <SplitBar title="Payment method" parts={[m.payment[0], m.payment[1]]} format={inrShort} countName="orders" />
                    <SplitBar title="First vs repeat orders" parts={[m.newRet[0], m.newRet[1]]} format={inrShort} countName="orders" />
                    <SplitBar title="Sales channel" parts={[m.channel[0], m.channel[1]]} format={inrShort} countName="orders" />
                </section>

                <section className="an-panel wide">
                    <div className="an-head"><h2>Product performance</h2><span className="an-note">{rangeLabel}</span></div>
                    <div className="scroll">
                        <table className="admin-table">
                            <thead><tr><th>Product</th><th className="num">Units</th><th className="num">Revenue</th><th className="num">Share</th><th>Rating</th></tr></thead>
                            <tbody>
                                {m.products.length ? m.products.map(pr => (
                                    <tr key={pr.product}>
                                        <td>{pr.product}</td>
                                        <td className="num">{pr.units}</td>
                                        <td className="num">{inr(pr.revenue)}</td>
                                        <td className="num">{m.kpis.revenue ? Math.round((pr.revenue / m.kpis.revenue) * 100) : 0}%</td>
                                        <td>{pr.avgRating != null ? <>★ {pr.avgRating.toFixed(1)} <span className="crm-muted">({pr.reviews})</span></> : <span className="crm-muted">no reviews</span>}</td>
                                    </tr>
                                )) : <tr><td colSpan={5}>No paid orders in this period.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="an-panel">
                    <div className="an-head"><h2>Customer segments</h2><span className="an-note">all time</span></div>
                    <div className="scroll">
                        <table className="admin-table">
                            <thead><tr><th>Segment</th><th className="num">People</th><th className="num">Revenue</th><th className="num">Share</th></tr></thead>
                            <tbody>
                                {m.segments.map(s => (
                                    <tr key={s.segment}>
                                        <td><span className={`crm-seg crm-seg--${s.segment.toLowerCase().replace(/[^a-z]/g, '')}`}>{s.segment}</span></td>
                                        <td className="num">{s.customers}</td>
                                        <td className="num">{s.revenue ? inrShort(s.revenue) : '—'}</td>
                                        <td className="num">{Math.round(s.share * 100)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="an-hint">Open the Customers tab to message any segment on WhatsApp or export it as a Meta Ads audience.</p>
                </section>

                <section className="an-panel">
                    <div className="an-head"><h2>Website checkout conversion</h2><span className="an-note">{rangeLabel}</span></div>
                    <div className="an-conv">
                        <div className="an-conv__big"><strong>{m.checkout.rate}%</strong><span>of checkouts got paid</span></div>
                        <SplitBar
                            title="Checkouts started"
                            parts={[
                                { label: 'Paid', value: m.checkout.paid, count: m.checkout.paid },
                                { label: 'Not paid (follow up)', value: m.checkout.unpaid, count: m.checkout.unpaid },
                            ]}
                            format={n => String(n)}
                            countName="checkouts"
                        />
                    </div>
                    <p className="an-hint">A checkout starts when a customer taps Pay. Unpaid ones show up in Today → “Recover unfinished checkouts”. Page views and add-to-cart live in Google Analytics.</p>
                </section>

                <section className="an-panel">
                    <div className="an-head"><h2>Repeat customers</h2><span className="an-note">by first-order month</span></div>
                    {m.cohorts.length ? m.cohorts.slice(-8).map(c => (
                        <div className="an-row" key={c.cohort}>
                            <span className="an-rl mono">{c.cohort}</span>
                            <div className="an-track"><div className="an-fill" style={{ width: `${c.repeatRate}%` }}></div></div>
                            <span className="an-rv">{c.repeatRate}% <small>· {c.customers}</small></span>
                        </div>
                    )) : <p className="an-empty">Needs repeat purchase history.</p>}
                </section>

                <section className="an-panel">
                    <div className="an-head"><h2>Coupon impact</h2><span className="an-note">{rangeLabel}</span></div>
                    {m.coupon.length ? m.coupon.map(c => (
                        <div className="an-ccrow" key={c.segment}>
                            <span className="an-cn">{c.segment}</span>
                            <span className="an-cbig mono">{c.orders}</span>
                            <span className="an-csm">AOV<br />{inr(c.avgOrderValue)}</span>
                            <span className="an-csm">discount<br />{inr(c.discountCost)}</span>
                        </div>
                    )) : <p className="an-empty">No paid orders in this period.</p>}
                </section>

                <section className="an-panel">
                    <div className="an-head"><h2>Lead pipeline</h2><span className="an-note">right now</span></div>
                    <div className="an-pipe">
                        <div className="an-pstat"><span className="p-v">{inrShort(m.pipeline.openPipelineValue)}</span><span className="p-l">open cart value</span></div>
                        <div className="an-pstat"><span className="p-v">{m.pipeline.reachableOpen}</span><span className="p-l">reachable leads</span></div>
                        <div className="an-pstat"><span className="p-v">{m.pipeline.conversionRate}%</span><span className="p-l">lead conversion</span></div>
                        <div className="an-pstat"><span className="p-v">{m.pipeline.tappedWhatsApp}</span><span className="p-l">tapped WhatsApp</span></div>
                    </div>
                </section>
            </div>
        </div>
    );
};
