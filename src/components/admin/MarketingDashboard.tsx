import { FC, useMemo, useState } from 'react';
import { useAdminData } from '../../hooks/useAdminData';
import { RANGES, RangeId, rangeWindow } from '../../services/analytics';
import {
    marketingKpis, bySource, byCampaign, adSeries, visitorsBySource, indexCampaigns,
} from '../../services/marketing';
import { ColumnChart, BarList } from './charts';
import { inr, inrShort, shortDate } from './format';
import { OrderSource } from './OrderSource';
import { MarketingCampaigns } from './MarketingCampaigns';
import { MarketingCoupons } from './MarketingCoupons';
import { MarketingSetup } from './MarketingSetup';
import { Icon } from '../common/Icon';

type View = 'overview' | 'campaigns' | 'coupons' | 'setup';

const VIEWS: { id: View; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'campaigns', label: 'Campaigns & spend' },
    { id: 'coupons', label: 'Coupons' },
    { id: 'setup', label: 'How tracking works' },
];

const roasText = (r: number | null) => (r == null ? '—' : `₹${r.toFixed(r < 10 ? 1 : 0)}`);

const Kpi: FC<{ label: string; value: string; sub: string }> = ({ label, value, sub }) => (
    <div className="today-kpi">
        <span className="today-kpi__label">{label}</span>
        <strong className="today-kpi__value">{value}</strong>
        <span className="today-kpi__delta">{sub}</span>
    </div>
);

const Overview: FC<{ goTo: (v: View) => void }> = ({ goTo }) => {
    const { attributed, marketing } = useAdminData();
    const [range, setRange] = useState<RangeId>('30d');
    const [now] = useState(() => Date.now());
    const [showAllUnknown, setShowAllUnknown] = useState(false);

    const m = useMemo(() => {
        const win = rangeWindow(range, now);
        const inWin = attributed.filter(a => a.at >= win.start && a.at < win.end);
        const idx = indexCampaigns(marketing.campaigns);
        return {
            win,
            kpis: marketingKpis(inWin, marketing.spend, win.start, win.end),
            sources: bySource(inWin),
            campaigns: byCampaign(inWin, marketing.spend, marketing.campaigns, win.start, win.end),
            series: adSeries(inWin, marketing.spend, win, now),
            visitors: visitorsBySource(marketing.visitors, idx, win.start, win.end),
            // Recent sales we can't credit yet — fixing these makes every number above sharper
            unknown: inWin
                .filter(a => (a.source === 'unknown' || a.source === 'meta_untagged') && a.at > now - 60 * 86400000)
                .sort((a, b) => b.at - a.at),
        };
    }, [attributed, marketing, range, now]);

    const k = m.kpis;
    const rangeLabel = RANGES.find(r => r.id === range)!.label.toLowerCase();
    const totalRevenue = m.sources.reduce((t, s) => t + s.revenue, 0);
    const noSpend = marketing.spend.length === 0;

    return (
        <>
            <div className="an-filters" role="radiogroup" aria-label="Date range">
                {RANGES.map(r => (
                    <button key={r.id} role="radio" aria-checked={range === r.id} className={`crm-chip ${range === r.id ? 'active' : ''}`} onClick={() => setRange(r.id)}>
                        {range === r.id && <Icon name="fa-check" />} {r.label}
                    </button>
                ))}
            </div>

            {noSpend && (
                <div className="mk-callout">
                    <Icon name="fa-lightbulb" />
                    <p>Add what you spend on ads to see whether they make money — <button className="crm-linkbtn" onClick={() => goTo('campaigns')}>import your Ads Manager report</button>. New to this? Start with <button className="crm-linkbtn" onClick={() => goTo('setup')}>How tracking works</button>.</p>
                </div>
            )}

            <div className="today-kpis">
                <Kpi label="Ad spend" value={inr(k.spend)} sub={k.results ? `${Math.round(k.results)} results in Ads Manager` : rangeLabel} />
                <Kpi label="Sales from ads" value={inr(k.adRevenue)} sub={`${k.adOrders} order${k.adOrders === 1 ? '' : 's'} · ${k.revenue ? Math.round((k.adRevenue / k.revenue) * 100) : 0}% of all sales`} />
                <Kpi label="Return per ₹1 of ads" value={roasText(k.roas)} sub={k.roas == null ? 'needs ad spend' : k.roas >= 1 ? 'ads are paying back' : 'ads cost more than they sell'} />
                <Kpi label="Cost per new customer" value={k.costPerNewCustomer ? inr(k.costPerNewCustomer) : '—'} sub={`${k.newFromAds} new customer${k.newFromAds === 1 ? '' : 's'} from ads`} />
                <Kpi label="Cost per chat / result" value={k.costPerResult ? inr(k.costPerResult) : '—'} sub={k.results ? 'from your Ads Manager results' : 'import results from Ads Manager'} />
            </div>

            <div className="an-grid">
                <section className="an-panel wide">
                    <div className="an-head"><h2>Sales from ads over time</h2><span className="an-note">hover a bar for spend · {rangeLabel}</span></div>
                    <ColumnChart
                        data={m.series.map(s => ({
                            label: s.label,
                            tooltipLabel: s.tooltipLabel,
                            value: s.adRevenue,
                            detail: `${s.orders} order${s.orders === 1 ? '' : 's'} · ${inr(s.spend)} spent${s.spend > 0 ? ` · ₹${(s.adRevenue / s.spend).toFixed(1)} back per ₹1` : ''}`,
                        }))}
                        format={inr}
                        axisFormat={inrShort}
                        ariaLabel={`Sales credited to ads, ${rangeLabel}`}
                        valueName="Sales from ads"
                    />
                </section>

                <section className="an-panel">
                    <div className="an-head"><h2>Where your sales come from</h2><span className="an-note">{rangeLabel}</span></div>
                    {m.sources.length ? (
                        <BarList
                            rows={m.sources.map(s => ({
                                label: s.label,
                                value: s.revenue,
                                sub: `${s.orders} order${s.orders === 1 ? '' : 's'} · ${s.newCustomers} new · ${s.viaWhatsApp} on WhatsApp`,
                            }))}
                            format={v => `${inrShort(v)} · ${totalRevenue ? Math.round((v / totalRevenue) * 100) : 0}%`}
                            ariaLabel="Sales by source"
                        />
                    ) : <p className="an-empty">No paid orders in this period.</p>}
                </section>

                <section className="an-panel">
                    <div className="an-head"><h2>Website visitors who reached out</h2><span className="an-note">{rangeLabel}</span></div>
                    {m.visitors.length ? (
                        <div className="scroll">
                            <table className="admin-table">
                                <thead><tr><th>Came from</th><th className="num">People</th><th className="num">Tapped WhatsApp</th><th className="num">Started checkout</th></tr></thead>
                                <tbody>
                                    {m.visitors.map(v => (
                                        <tr key={v.source}>
                                            <td>{v.label}</td>
                                            <td className="num">{v.people}</td>
                                            <td className="num">{v.tappedWhatsApp}</td>
                                            <td className="num">{v.startedCheckout}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <p className="an-empty">Starts filling as soon as visitors tap WhatsApp or start checkout.</p>}
                    <p className="an-hint">Visitors who tapped a WhatsApp button or started checkout. Page views live in Google Analytics.</p>
                </section>

                <section className="an-panel wide">
                    <div className="an-head"><h2>Campaigns</h2><span className="an-note">{rangeLabel}</span></div>
                    {m.campaigns.length ? (
                        <div className="scroll">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Campaign</th><th className="num">Spent</th><th className="num">Results</th><th className="num">Cost / result</th>
                                        <th className="num">Orders</th><th className="num">Sales</th><th className="num">Back per ₹1</th><th className="num">Cost / order</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {m.campaigns.map(c => (
                                        <tr key={c.key}>
                                            <td>
                                                {c.name}
                                                {!c.campaign && c.key.startsWith('utm:') && <div className="crm-muted">from ad links</div>}
                                                {c.viaWhatsApp > 0 && <div className="crm-muted">{c.viaWhatsApp} sold on WhatsApp</div>}
                                            </td>
                                            <td className="num">{c.spend ? inr(c.spend) : '—'}</td>
                                            <td className="num">{c.results ? Math.round(c.results) : '—'}</td>
                                            <td className="num">{c.costPerResult ? inr(c.costPerResult) : '—'}</td>
                                            <td className="num">{c.orders}</td>
                                            <td className="num">{c.revenue ? inr(c.revenue) : '—'}</td>
                                            <td className="num">
                                                {roasText(c.roas)}
                                                {c.roas != null && c.roas < 1 && <div className="crm-warn mk-flag">losing money</div>}
                                            </td>
                                            <td className="num">{c.costPerOrder ? inr(c.costPerOrder) : '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="an-empty">No campaigns yet — <button className="crm-linkbtn" onClick={() => goTo('campaigns')}>add one</button>.</p>
                    )}
                    <p className="an-hint">“Back per ₹1” counts the full order value, before the cost of the bat. A bat sale makes a profit only when this is comfortably above your cost of making it.</p>
                </section>

                <section className="an-panel wide">
                    <div className="an-head">
                        <h2>Sales without a source</h2>
                        <span className="an-note">last 60 days · {m.unknown.length}</span>
                    </div>
                    {m.unknown.length ? (
                        <>
                            <p className="an-hint">Tell us where these customers came from — each one you fill in makes the numbers above more accurate.</p>
                            <ul className="mk-unknown">
                                {(showAllUnknown ? m.unknown : m.unknown.slice(0, 8)).map(a => (
                                    <li key={a.order.id}>
                                        <div>
                                            <strong>{a.order.customerName || 'Customer'}</strong>
                                            <span className="crm-muted">{inr(a.revenue)} · {shortDate(new Date(a.at))} · {a.via === 'whatsapp' ? 'WhatsApp' : 'website'}</span>
                                        </div>
                                        <OrderSource order={a.order} compact />
                                    </li>
                                ))}
                            </ul>
                            {m.unknown.length > 8 && (
                                <div className="crm-more">
                                    <button className="crm-linkbtn" onClick={() => setShowAllUnknown(v => !v)}>{showAllUnknown ? 'Show fewer' : `Show all ${m.unknown.length}`}</button>
                                </div>
                            )}
                        </>
                    ) : <p className="today-card__empty">Every recent sale has a source. 🎯</p>}
                </section>
            </div>
        </>
    );
};

export const MarketingDashboard: FC = () => {
    const { loading, failed, refresh, openRecordSale } = useAdminData();
    const [view, setView] = useState<View>('overview');

    return (
        <div className="analytics-dash">
            <div className="management-header">
                <h1>Marketing</h1>
                <p className="order-count">Which ads and channels bring buyers — on the website and on WhatsApp</p>
                <button className="btn crm-btn-wa" onClick={() => openRecordSale()}>
                    <Icon name="fa-whatsapp" /> Record WhatsApp sale
                </button>
            </div>

            {failed.includes('marketing') && (
                <p className="crm-warn" role="alert">
                    Couldn’t load campaigns and ad spend. <button className="crm-linkbtn" onClick={refresh}>Try again</button>
                </p>
            )}

            <div className="mk-tabs" role="tablist" aria-label="Marketing sections">
                {VIEWS.map(v => (
                    <button key={v.id} role="tab" aria-selected={view === v.id} className={`mk-tab ${view === v.id ? 'active' : ''}`} onClick={() => setView(v.id)}>
                        {v.label}
                    </button>
                ))}
            </div>

            {loading && view === 'overview' ? (
                <div className="admin-loading"><div className="loading-spinner"></div><p>Loading marketing data…</p></div>
            ) : view === 'overview' ? <Overview goTo={setView} />
                : view === 'campaigns' ? <MarketingCampaigns />
                    : view === 'coupons' ? <MarketingCoupons />
                        : <MarketingSetup />}
        </div>
    );
};
