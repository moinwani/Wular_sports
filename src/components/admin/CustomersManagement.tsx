import { FC, useMemo, useState, useEffect } from 'react';
import { useAdminData } from '../../hooks/useAdminData';
import {
    Customer, Segment, SEGMENTS, AT_RISK_DAYS, toDate,
    exportCustomersCSV, exportMetaAudienceCSV, whatsappLink,
} from '../../services/customers';
import { WA_TEMPLATES, defaultTemplateFor, templateById } from '../../services/whatsappTemplates';
import { inr, daysAgo, shortDate } from './format';
import { Icon } from '../common/Icon';
import { sourceDef } from '../../lib/marketing';

type SegmentFilter = 'all' | Segment | 'atrisk';
type SortKey = 'spent' | 'recent' | 'orders' | 'lead';

const SEGMENT_HELP: Record<Segment, string> = {
    'Wholesale': '₹1L+ spent or a 10+ bat order',
    'VIP': '3+ orders or ₹15K+ spent',
    'Repeat': '2 orders',
    'New buyer': '1 order',
    'Lead': 'started checkout, never paid',
    'Subscriber': 'email only',
};

const PAGE_SIZE = 50;

const QUICK_TAGS = ['wholesale', 'team captain', 'academy', 'coach', 'club', 'shop owner', 'influencer', 'gift buyer'];

const segClass = (s: Segment) => `crm-seg crm-seg--${s.toLowerCase().replace(/[^a-z]/g, '')}`;

const recentlyContacted = (c: Customer, days = 14) => {
    const t = c.profile.lastContactedAt ? new Date(c.profile.lastContactedAt).getTime() : 0;
    return t > 0 && Date.now() - t < days * 86400000;
};

export const CustomersManagement: FC = () => {
    const { customers, loading, failed, refresh, contact } = useAdminData();
    const [segment, setSegment] = useState<SegmentFilter>('all');
    const [search, setSearch] = useState('');
    const [state, setState] = useState('all');
    const [sort, setSort] = useState<SortKey>('spent');
    const [openKey, setOpenKey] = useState<string | null>(null);
    const [campaign, setCampaign] = useState(false);
    const [shown, setShown] = useState(PAGE_SIZE);

    useEffect(() => { setShown(PAGE_SIZE); }, [segment, search, state, sort]);

    const counts = useMemo(() => {
        const c: Record<string, number> = { all: customers.length, atrisk: 0 };
        SEGMENTS.forEach(s => { c[s] = 0; });
        customers.forEach(x => { c[x.segment]++; if (x.atRisk) c.atrisk++; });
        return c;
    }, [customers]);

    const states = useMemo(
        () => [...new Set(customers.map(c => c.state).filter(Boolean))].sort(),
        [customers]
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = customers.filter(c =>
            (segment === 'all' || (segment === 'atrisk' ? c.atRisk : c.segment === segment)) &&
            (state === 'all' || c.state === state) &&
            (!q || [c.name, c.phone, c.email, c.city, c.state, ...(c.profile.tags || [])]
                .some(v => (v || '').toLowerCase().includes(q)))
        );
        const leadTime = (c: Customer) => toDate(c.lead?.updatedAt)?.getTime() || 0;
        const sorters: Record<SortKey, (a: Customer, b: Customer) => number> = {
            spent: (a, b) => b.totalSpent - a.totalSpent,
            recent: (a, b) => (b.lastOrderAt?.getTime() || 0) - (a.lastOrderAt?.getTime() || 0),
            orders: (a, b) => b.paidOrders - a.paidOrders,
            lead: (a, b) => leadTime(b) - leadTime(a),
        };
        return [...list].sort(sorters[sort]);
    }, [customers, segment, state, search, sort]);

    const open = openKey ? customers.find(c => c.key === openKey) || null : null;

    if (loading && customers.length === 0) {
        return <div className="admin-loading"><div className="loading-spinner"></div><p>Loading customers…</p></div>;
    }

    return (
        <div className="crm">
            <div className="management-header">
                <h1>Customers</h1>
                <p className="order-count">{customers.length} people · {counts['Wholesale'] + counts['VIP'] + counts['Repeat'] + counts['New buyer']} buyers</p>
            </div>

            {failed.length > 0 && (
                <p className="dashboard-hint">⚠️ Couldn't load {failed.join(', ')} — those customers may be missing. <button className="crm-linkbtn" onClick={refresh}>Retry</button></p>
            )}

            <div className="crm-chips" role="tablist" aria-label="Customer segments">
                {(['all', ...SEGMENTS, 'atrisk'] as SegmentFilter[]).map(s => (
                    <button
                        key={s}
                        role="tab"
                        aria-selected={segment === s}
                        className={`crm-chip ${segment === s ? 'active' : ''} ${s === 'atrisk' ? 'crm-chip--risk' : ''}`}
                        onClick={() => setSegment(s)}
                        title={s === 'all' ? '' : s === 'atrisk' ? `Bought before, nothing in ${AT_RISK_DAYS}+ days` : SEGMENT_HELP[s as Segment]}
                    >
                        {s === 'all' ? 'All' : s === 'atrisk' ? 'At risk' : s}
                        <span className="crm-chip__n">{counts[s] ?? 0}</span>
                    </button>
                ))}
            </div>

            <div className="crm-toolbar">
                <div className="crm-search">
                    <Icon name="fa-search" />
                    <input
                        type="search"
                        placeholder="Search name, phone, city, tag…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        aria-label="Search customers"
                    />
                </div>
                <select className="status-filter" value={state} onChange={e => setState(e.target.value)} aria-label="Filter by state">
                    <option value="all">All states</option>
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select className="status-filter" value={sort} onChange={e => setSort(e.target.value as SortKey)} aria-label="Sort customers">
                    <option value="spent">Top spenders</option>
                    <option value="recent">Most recent order</option>
                    <option value="orders">Most orders</option>
                    <option value="lead">Latest checkout activity</option>
                </select>
                <div className="crm-toolbar__actions">
                    <button className="btn crm-btn-wa" onClick={() => setCampaign(true)} disabled={!filtered.some(c => c.phone)}>
                        <Icon name="fa-whatsapp" /> Message these {filtered.filter(c => c.phone).length}
                    </button>
                    <button className="btn" onClick={() => exportCustomersCSV(filtered)} disabled={!filtered.length} title="Spreadsheet of this list — e.g. for a WhatsApp Business broadcast list">
                        <Icon name="fa-download" /> CSV
                    </button>
                    <button className="btn" onClick={() => exportMetaAudienceCSV(filtered)} disabled={!filtered.length} title="Upload in Meta Ads Manager → Audiences → Customer list, then create a Lookalike">
                        <Icon name="fa-download" /> Meta audience
                    </button>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="empty-state">
                    <Icon name="fa-users" style={{ fontSize: '48px', color: '#666' }} />
                    <p>No customers match these filters.</p>
                </div>
            ) : (
                <div className="orders-table-container">
                    <table className="admin-table crm-table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Segment</th>
                                <th>Location</th>
                                <th className="num">Orders</th>
                                <th className="num">Spent</th>
                                <th>Last order</th>
                                <th>Contacted</th>
                                <th aria-label="Actions"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.slice(0, shown).map(c => (
                                <tr key={c.key} onClick={() => setOpenKey(c.key)} className="crm-row">
                                    <td>
                                        <div className="customer-cell">
                                            <strong>{c.name}</strong>
                                            <span className="customer-email">{c.phone || c.email}</span>
                                            {(c.profile.tags || []).length > 0 && (
                                                <span className="crm-tags-inline">{c.profile.tags!.map(t => <span key={t} className="crm-tag">{t}</span>)}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={segClass(c.segment)}>{c.segment}</span>
                                        {c.atRisk && <span className="crm-risk">at risk</span>}
                                    </td>
                                    <td>{[c.city, c.state].filter(Boolean).join(', ') || '—'}</td>
                                    <td className="num">{c.paidOrders}</td>
                                    <td className="num">{c.totalSpent ? inr(c.totalSpent) : '—'}</td>
                                    <td>{c.lastOrderAt ? daysAgo(c.lastOrderAt) : c.lead ? <span className="crm-muted">checkout {daysAgo(toDate(c.lead.updatedAt))}</span> : '—'}</td>
                                    <td>{c.profile.lastContactedAt ? daysAgo(c.profile.lastContactedAt) : <span className="crm-muted">never</span>}</td>
                                    <td onClick={e => e.stopPropagation()}>
                                        {c.phone && (
                                            <button
                                                className="btn-view crm-wa-icon"
                                                title={`WhatsApp: ${defaultTemplateFor(c).label}`}
                                                onClick={() => contact(c, defaultTemplateFor(c).id)}
                                                aria-label={`WhatsApp ${c.name}`}
                                            >
                                                <Icon name="fa-whatsapp" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {filtered.length > shown && (
                <div className="crm-more">
                    <span className="crm-muted">Showing {shown} of {filtered.length}</span>
                    <button className="btn" onClick={() => setShown(s => s + PAGE_SIZE)}>Show {Math.min(PAGE_SIZE, filtered.length - shown)} more</button>
                </div>
            )}

            {open && <CustomerDrawer key={open.key} customer={open} onClose={() => setOpenKey(null)} />}
            {campaign && <CampaignQueue customers={filtered.filter(c => c.phone)} onClose={() => setCampaign(false)} />}
        </div>
    );
};

/* ───────────────────────── Customer drawer ───────────────────────── */

const CustomerDrawer: FC<{ customer: Customer; onClose: () => void }> = ({ customer: c, onClose }) => {
    const { saveProfile, contact, attributed, openRecordSale } = useAdminData();
    const acquired = attributed.find(a => a.customerKey === c.key);
    const [tags, setTags] = useState<string[]>(c.profile.tags || []);
    const [tagInput, setTagInput] = useState('');
    const [notes, setNotes] = useState(c.profile.notes || '');
    const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | string>('idle');
    const [tplId, setTplId] = useState(defaultTemplateFor(c).id);
    const [message, setMessage] = useState(defaultTemplateFor(c).build(c));

    useEffect(() => { setMessage(templateById(tplId)?.build(c) || ''); }, [tplId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    const dirty = notes !== (c.profile.notes || '') || tags.join('|') !== (c.profile.tags || []).join('|');

    const save = async () => {
        setSaveState('saving');
        const err = await saveProfile(c.key, { tags, notes });
        setSaveState(err ? `Couldn't save — ${err}` : 'saved');
    };

    const addTag = (t: string) => {
        const v = t.trim().toLowerCase();
        if (v && !tags.includes(v)) setTags([...tags, v]);
        setTagInput('');
    };

    return (
        <div className="crm-drawer-overlay" onClick={onClose}>
            <aside className="crm-drawer" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Customer ${c.name}`}>
                <header className="crm-drawer__head">
                    <div>
                        <h2>{c.name}</h2>
                        <p>
                            <span className={segClass(c.segment)}>{c.segment}</span>
                            {c.atRisk && <span className="crm-risk">at risk · {c.daysSinceLastOrder}d since last order</span>}
                            {c.subscribed && <span className="crm-tag">newsletter</span>}
                            {c.sources.includes('whatsapp') && <span className="crm-tag">buys on WhatsApp</span>}
                        </p>
                    </div>
                    <button className="modal-close" onClick={onClose} aria-label="Close"><Icon name="fa-times" /></button>
                </header>

                <div className="crm-drawer__body">
                    <section className="crm-contact-row">
                        {c.phone && <a href={`tel:${c.phone}`}><Icon name="fa-phone" /> {c.phone}</a>}
                        {c.email && <a href={`mailto:${c.email}`}><Icon name="fa-envelope" /> {c.email}</a>}
                        {(c.city || c.state) && <span><Icon name="fa-map-marker-alt" /> {[c.city, c.state, c.country !== 'India' ? c.country : ''].filter(Boolean).join(', ')}</span>}
                    </section>

                    <section className="mk-acquired">
                        <span>
                            {acquired
                                ? <>First came from <strong>{sourceDef(acquired.source).label}</strong>{acquired.campaignName && <> · {acquired.campaignName}</>}</>
                                : <span className="crm-muted">No paid order yet</span>}
                        </span>
                        <button className="btn crm-btn-wa" onClick={() => { onClose(); openRecordSale({ name: c.name, phone: c.phone, email: c.email, city: c.city, state: c.state }); }}>
                            <Icon name="fa-plus" /> Record a sale
                        </button>
                    </section>

                    <section className="crm-stats">
                        <div><span>Total spent</span><strong>{inr(c.totalSpent)}</strong></div>
                        <div><span>Paid orders</span><strong>{c.paidOrders}</strong></div>
                        <div><span>Avg order</span><strong>{c.avgOrder ? inr(c.avgOrder) : '—'}</strong></div>
                        <div><span>Bats bought</span><strong>{c.batsBought}</strong></div>
                        <div><span>First order</span><strong>{shortDate(c.firstOrderAt)}</strong></div>
                        <div><span>Last order</span><strong>{c.lastOrderAt ? daysAgo(c.lastOrderAt) : '—'}</strong></div>
                    </section>

                    <section className="crm-section">
                        <h3>Message on WhatsApp</h3>
                        {c.phone ? (
                            <>
                                <div className="crm-tpl-row">
                                    {WA_TEMPLATES.map(t => (
                                        <button key={t.id} className={`crm-chip ${tplId === t.id ? 'active' : ''}`} onClick={() => setTplId(t.id)}>
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                                <textarea className="crm-textarea" rows={6} value={message} onChange={e => setMessage(e.target.value)} aria-label="Message" />
                                {recentlyContacted(c) && <p className="crm-warn">You messaged {c.name.split(' ')[0]} {daysAgo(c.profile.lastContactedAt!)} — avoid messaging too often.</p>}
                                <button className="btn crm-btn-wa" onClick={() => contact(c, tplId, message)}>
                                    <Icon name="fa-whatsapp" /> Open in WhatsApp
                                </button>
                            </>
                        ) : <p className="crm-muted">No phone number on file.</p>}
                    </section>

                    <section className="crm-section">
                        <h3>Tags &amp; notes</h3>
                        <div className="crm-tags-edit">
                            {tags.map(t => (
                                <span key={t} className="crm-tag crm-tag--edit">
                                    {t}
                                    <button onClick={() => setTags(tags.filter(x => x !== t))} aria-label={`Remove tag ${t}`}>×</button>
                                </span>
                            ))}
                            <input
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); } }}
                                placeholder="Add tag + Enter"
                                aria-label="Add tag"
                            />
                        </div>
                        <div className="crm-quicktags">
                            {QUICK_TAGS.filter(t => !tags.includes(t)).map(t => (
                                <button key={t} className="crm-linkbtn" onClick={() => addTag(t)}>+ {t}</button>
                            ))}
                        </div>
                        <textarea
                            className="crm-textarea"
                            rows={3}
                            value={notes}
                            onChange={e => { setNotes(e.target.value); setSaveState('idle'); }}
                            placeholder="Private notes — preferred bat weight, team name, follow-up date…"
                            aria-label="Notes"
                        />
                        <div className="crm-save-row">
                            <button className="btn" onClick={save} disabled={!dirty || saveState === 'saving'}>
                                {saveState === 'saving' ? 'Saving…' : 'Save tags & notes'}
                            </button>
                            {saveState === 'saved' && !dirty && <span className="crm-ok">Saved</span>}
                            {saveState.startsWith("Couldn't") && <span className="crm-warn">{saveState}</span>}
                        </div>
                    </section>

                    {c.lead && (
                        <section className="crm-section">
                            <h3>Checkout activity</h3>
                            <p>{c.lead.status === 'converted' ? 'Converted' : 'Started checkout, didn\'t pay'} · last active {daysAgo(toDate(c.lead.updatedAt))}</p>
                            {c.lead.cartSummary && <p>🛒 {c.lead.cartSummary}{c.lead.cartTotal ? ` — ${inr(c.lead.cartTotal)}` : ''}</p>}
                            {(c.lead.whatsappClicks || 0) > 0 && <p>💬 Tapped WhatsApp {c.lead.whatsappClicks}×{c.lead.whatsappProduct ? ` on ${c.lead.whatsappProduct}` : ''}</p>}
                            {c.lead.visitorRef && <p className="crm-muted">WhatsApp ref: {c.lead.visitorRef}</p>}
                        </section>
                    )}

                    <section className="crm-section">
                        <h3>Orders ({c.orders.length})</h3>
                        {c.orders.length === 0 ? <p className="crm-muted">No orders yet.</p> : (
                            <ul className="crm-orders">
                                {c.orders.map(o => (
                                    <li key={o.id}>
                                        <div>
                                            <strong>{shortDate(toDate(o.createdAt))}</strong>
                                            <span className="crm-muted">{(o.items || []).map((i: any) => `${i.productName}${i.quantity > 1 ? ` ×${i.quantity}` : ''}`).join(', ')}</span>
                                        </div>
                                        <div className="crm-orders__right">
                                            <span className={`status-badge status-${o.status}`}>{o.status}</span>
                                            <strong>{inr(o.total)}</strong>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {(c.profile.contacts || []).length > 0 && (
                        <section className="crm-section">
                            <h3>Contact history</h3>
                            <ul className="crm-contacts">
                                {c.profile.contacts!.map((x, i) => (
                                    <li key={i}><span>{templateById(x.template)?.label || x.template}</span><span className="crm-muted">{daysAgo(x.at)}</span></li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>
            </aside>
        </div>
    );
};

/* ───────────────────────── Campaign queue ───────────────────────── */

const CampaignQueue: FC<{ customers: Customer[]; onClose: () => void }> = ({ customers, onClose }) => {
    const { contact } = useAdminData();
    const [tplId, setTplId] = useState(() => defaultTemplateFor(customers[0]).id);
    const [sent, setSent] = useState<Set<string>>(new Set());
    const [skipRecent, setSkipRecent] = useState(true);

    const queue = customers.filter(c => !skipRecent || !recentlyContacted(c));
    const tpl = templateById(tplId)!;

    const send = (c: Customer) => {
        contact(c, tplId);
        setSent(prev => new Set(prev).add(c.key));
    };

    return (
        <div className="crm-drawer-overlay" onClick={onClose}>
            <aside className="crm-drawer" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="WhatsApp campaign">
                <header className="crm-drawer__head">
                    <div>
                        <h2>WhatsApp campaign</h2>
                        <p className="crm-muted">{sent.size} of {queue.length} sent</p>
                    </div>
                    <button className="modal-close" onClick={onClose} aria-label="Close"><Icon name="fa-times" /></button>
                </header>
                <div className="crm-drawer__body">
                    <p className="dashboard-hint">
                        WhatsApp opens one chat per customer — tap <strong>Send</strong>, hit send in WhatsApp, come back for the next.
                        For 100+ people at once, use the <strong>CSV</strong> export to build a WhatsApp Business broadcast list.
                    </p>
                    <div className="crm-tpl-row">
                        {WA_TEMPLATES.map(t => (
                            <button key={t.id} className={`crm-chip ${tplId === t.id ? 'active' : ''}`} onClick={() => setTplId(t.id)}>{t.label}</button>
                        ))}
                    </div>
                    <pre className="crm-preview">{tpl.build(queue[0] || customers[0])}</pre>
                    <label className="crm-check">
                        <input type="checkbox" checked={skipRecent} onChange={e => setSkipRecent(e.target.checked)} />
                        Skip people messaged in the last 14 days
                    </label>
                    <ul className="crm-queue">
                        {queue.map(c => (
                            <li key={c.key} className={sent.has(c.key) ? 'done' : ''}>
                                <div>
                                    <strong>{c.name}</strong>
                                    <span className="crm-muted">{c.segment}{c.city ? ` · ${c.city}` : ''}{c.totalSpent ? ` · ${inr(c.totalSpent)}` : ''}</span>
                                </div>
                                {sent.has(c.key)
                                    ? <span className="crm-ok"><Icon name="fa-check" /> Sent</span>
                                    : whatsappLink(c.phone, '') && <button className="btn crm-btn-wa" onClick={() => send(c)}><Icon name="fa-whatsapp" /> Send</button>}
                            </li>
                        ))}
                    </ul>
                </div>
            </aside>
        </div>
    );
};
