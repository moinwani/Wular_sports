import { FC, useEffect, useMemo, useState } from 'react';
import { useAdminData } from '../../hooks/useAdminData';
import { products } from '../../data/products';
import { INDIAN_STATES } from '../../data/constants';
import { keyFor } from '../../services/customers';
import { marketingAction } from '../../services/admin';
import { indexCampaigns, resolveTrail, describeTouch } from '../../services/marketing';
import { SOURCES, isPaidSource, normalizeCode, couponDiscount, couponLive } from '../../lib/marketing';
import { inr } from './format';
import { Icon } from '../common/Icon';

/** Pre-fill for the form, e.g. from a customer's profile */
export interface SaleDraft {
    name?: string;
    phone?: string;
    email?: string;
    city?: string;
    state?: string;
}

interface Line { productId: string; name: string; price: string; quantity: string; }

const CATALOG = products.map(p => ({ id: p.id, name: p.name.split(' — ')[0].trim(), price: p.price }));
const PAYMENT_MODES = [
    { id: 'upi', label: 'UPI' }, { id: 'bank', label: 'Bank transfer' }, { id: 'cash', label: 'Cash' },
    { id: 'cod', label: 'Cash on delivery' }, { id: 'card', label: 'Card' }, { id: 'other', label: 'Other' },
];
const STATUSES = [
    { id: 'confirmed', label: 'Paid — still to pack' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
];
const today = () => new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10);
const blankLine = (): Line => ({ productId: CATALOG[0].id, name: CATALOG[0].name, price: String(CATALOG[0].price), quantity: '1' });
const last10 = (p: string) => p.replace(/\D/g, '').slice(-10);

export const RecordSaleModal: FC<{ draft: SaleDraft; onClose: () => void }> = ({ draft, onClose }) => {
    const { customers, leads, marketing } = useAdminData();
    const [phone, setPhone] = useState(draft.phone || '');
    const [name, setName] = useState(draft.name || '');
    const [city, setCity] = useState(draft.city || '');
    const [state, setState] = useState(draft.state || '');
    const [email, setEmail] = useState(draft.email || '');
    const [address, setAddress] = useState('');
    const [pincode, setPincode] = useState('');
    const [lines, setLines] = useState<Line[]>([blankLine()]);
    const [coupon, setCoupon] = useState('');
    const [extraDiscount, setExtraDiscount] = useState('');
    const [paymentMode, setPaymentMode] = useState('upi');
    const [status, setStatus] = useState('confirmed');
    const [date, setDate] = useState(today());
    const [ref, setRef] = useState('');
    const [adCode, setAdCode] = useState('');
    const [source, setSource] = useState('');
    const [campaignId, setCampaignId] = useState('');
    const [notes, setNotes] = useState('');
    const [sendToMeta, setSendToMeta] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState<{ meta: any; foundWebsiteVisit: boolean } | null>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const idx = useMemo(() => indexCampaigns(marketing.campaigns), [marketing.campaigns]);
    const existing = useMemo(() => {
        const k = last10(phone).length === 10 ? keyFor(phone, '') : '';
        return k ? customers.find(c => c.key === k) || null : null;
    }, [phone, customers]);

    // Fill name / place from their earlier orders or checkout
    useEffect(() => {
        if (!existing) return;
        setName(n => n || existing.name);
        setCity(v => v || existing.city);
        setState(v => v || existing.state);
        setEmail(v => v || existing.email);
    }, [existing]);

    // Their website visit: by Ref code from the message, else via their checkout lead's phone
    const trail = useMemo(() => {
        const code = normalizeCode(ref);
        const visitorRef = /^WS-[A-Z0-9]{6}$/.test(code)
            ? code
            : leads.find(l => last10(l.phone || '') === last10(phone) && last10(phone).length === 10)?.visitorRef;
        if (!visitorRef) return null;
        const v = marketing.visitors.find(x => x.ref === visitorRef);
        const r = v ? resolveTrail(v.attribution, idx) : null;
        return { ref: visitorRef, resolved: r, touch: v?.attribution?.last || v?.attribution?.first || null };
    }, [ref, phone, leads, marketing.visitors, idx]);

    // An ad code in their first message points straight at a campaign
    const codeCampaign = adCode ? idx.byCode.get(normalizeCode(adCode)) : undefined;
    useEffect(() => {
        if (codeCampaign) {
            setSource('meta_ads');
            setCampaignId(codeCampaign.id);
        }
    }, [codeCampaign]);

    const couponDef = marketing.coupons.find(c => c.code === normalizeCode(coupon) && couponLive(c));
    const subtotal = lines.reduce((s, l) => s + (Number(l.price) || 0) * (Number(l.quantity) || 0), 0);
    const bats = lines.reduce((s, l) => s + (Number(l.quantity) || 0), 0);
    const discount = Math.min(subtotal, (couponDef ? couponDiscount(couponDef, subtotal, bats) : 0) + (Number(extraDiscount) || 0));
    const total = subtotal - discount;
    const tooOldForMeta = Date.parse(`${date}T12:00:00+05:30`) < Date.now() - 7 * 86400000;

    const setLine = (i: number, patch: Partial<Line>) => setLines(ls => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
    const pickProduct = (i: number, id: string) => {
        const p = CATALOG.find(x => x.id === id);
        setLine(i, p ? { productId: p.id, name: p.name, price: String(p.price) } : { productId: '', name: '', price: '' });
    };

    const willCountAs = source
        ? SOURCES.find(s => s.id === source)?.label
        : trail?.resolved
            ? `${SOURCES.find(s => s.id === trail.resolved!.source)?.label} (from their website visit)`
            : existing && existing.paidOrders > 0 ? 'Repeat customer' : 'Not recorded';

    const save = async () => {
        setError('');
        if (last10(phone).length < 10) return setError('Enter their 10-digit phone number.');
        if (!name.trim()) return setError('Enter the customer’s name.');
        if (lines.some(l => !l.name.trim() || !(Number(l.quantity) >= 1) || !(Number(l.price) >= 0))) {
            return setError('Check each bat has a name, a quantity of at least 1 and a price.');
        }
        setSaving(true);
        try {
            const res = await marketingAction('recordSale', {
                customer: { name, phone, email, city, state, address, pincode },
                items: lines.map(l => ({ productId: l.productId, productName: l.name, price: Number(l.price), quantity: Number(l.quantity) })),
                discount,
                couponCode: couponDef?.code || '',
                paymentMode, status, date,
                ref: trail?.ref || '',
                adCode, source, campaignId,
                notes,
                sendToMeta,
            });
            if (res.error) return setError(res.error);
            setDone({ meta: res.meta, foundWebsiteVisit: res.foundWebsiteVisit });
        } catch {
            setError('Could not save — check your connection and try again.');
        } finally {
            setSaving(false);
        }
    };

    const paidCampaigns = marketing.campaigns.filter(c => c.status !== 'ended');

    return (
        <div className="crm-drawer-overlay" onClick={onClose}>
            <aside className="crm-drawer mk-sale" role="dialog" aria-modal="true" aria-label="Record a WhatsApp sale" onClick={e => e.stopPropagation()}>
                <div className="crm-drawer__head">
                    <div>
                        <h2>Record a WhatsApp sale</h2>
                        <p className="crm-muted">Adds the order to your dashboard and credits the ad that brought them.</p>
                    </div>
                    <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
                </div>

                {done ? (
                    <div className="crm-drawer__body">
                        <div className="mk-done">
                            <Icon name="fa-check-circle" />
                            <h3>Sale saved — {inr(total)}</h3>
                            <p>It now shows in Orders, Customers and Marketing.</p>
                            {done.foundWebsiteVisit && <p>We linked it to their website visit, so the ad gets the credit.</p>}
                            <p className="crm-muted">
                                Meta: {!done.meta ? (marketing.metaConfigured ? 'not sent (you unticked it)' : 'not connected')
                                    : done.meta.status === 'sent' ? '✓ sale sent — your ads will learn from it'
                                        : done.meta.status === 'skipped' ? `skipped — ${done.meta.reason}`
                                            : `✗ ${done.meta.reason}`}
                            </p>
                        </div>
                        <div className="crm-save-row">
                            <button className="btn" onClick={onClose}>Done</button>
                        </div>
                    </div>
                ) : (
                    <div className="crm-drawer__body">
                        <section className="crm-section">
                            <h3>Customer</h3>
                            <div className="mk-grid">
                                <label className="mk-field">
                                    <span>WhatsApp number</span>
                                    <input className="mk-input" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="98765 43210" autoFocus />
                                </label>
                                <label className="mk-field">
                                    <span>Name</span>
                                    <input className="mk-input" value={name} onChange={e => setName(e.target.value)} />
                                </label>
                                <label className="mk-field">
                                    <span>City</span>
                                    <input className="mk-input" value={city} onChange={e => setCity(e.target.value)} />
                                </label>
                                <label className="mk-field">
                                    <span>State</span>
                                    <select className="status-filter mk-input" value={state} onChange={e => setState(e.target.value)}>
                                        <option value="">—</option>
                                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </label>
                            </div>
                            {existing && existing.paidOrders > 0 && (
                                <p className="crm-ok">Existing customer · {existing.paidOrders} order{existing.paidOrders === 1 ? '' : 's'} · {inr(existing.totalSpent)} so far</p>
                            )}
                            <details className="mk-more">
                                <summary>Address &amp; email (optional)</summary>
                                <div className="mk-grid">
                                    <label className="mk-field mk-span2">
                                        <span>Address</span>
                                        <input className="mk-input" value={address} onChange={e => setAddress(e.target.value)} />
                                    </label>
                                    <label className="mk-field">
                                        <span>PIN code</span>
                                        <input className="mk-input" inputMode="numeric" value={pincode} onChange={e => setPincode(e.target.value)} />
                                    </label>
                                    <label className="mk-field">
                                        <span>Email</span>
                                        <input className="mk-input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                                    </label>
                                </div>
                            </details>
                        </section>

                        <section className="crm-section">
                            <h3>What they bought</h3>
                            {lines.map((l, i) => (
                                <div className="mk-line" key={i}>
                                    <select className="status-filter mk-input" value={l.productId} onChange={e => pickProduct(i, e.target.value)} aria-label="Bat">
                                        {CATALOG.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        <option value="">Other…</option>
                                    </select>
                                    {!l.productId && (
                                        <input className="mk-input" placeholder="What was it?" value={l.name} onChange={e => setLine(i, { name: e.target.value })} aria-label="Item name" />
                                    )}
                                    <label className="mk-inline">
                                        <span>Qty</span>
                                        <input className="mk-input mk-num" inputMode="numeric" value={l.quantity} onChange={e => setLine(i, { quantity: e.target.value.replace(/\D/g, '') })} />
                                    </label>
                                    <label className="mk-inline">
                                        <span>₹ each</span>
                                        <input className="mk-input mk-num" inputMode="numeric" value={l.price} onChange={e => setLine(i, { price: e.target.value.replace(/[^\d.]/g, '') })} />
                                    </label>
                                    {lines.length > 1 && (
                                        <button className="crm-linkbtn" onClick={() => setLines(ls => ls.filter((_, j) => j !== i))} aria-label="Remove this item">Remove</button>
                                    )}
                                </div>
                            ))}
                            <button className="crm-linkbtn" onClick={() => setLines(ls => [...ls, blankLine()])}>+ Add another bat</button>
                            <div className="mk-grid mk-grid--tight">
                                <label className="mk-field">
                                    <span>Coupon used</span>
                                    <select className="status-filter mk-input" value={coupon} onChange={e => setCoupon(e.target.value)}>
                                        <option value="">None</option>
                                        {marketing.coupons.filter(c => couponLive(c)).map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                                    </select>
                                </label>
                                <label className="mk-field">
                                    <span>Extra discount ₹</span>
                                    <input className="mk-input" inputMode="numeric" value={extraDiscount} onChange={e => setExtraDiscount(e.target.value.replace(/\D/g, ''))} placeholder="0" />
                                </label>
                            </div>
                            <p className="mk-total">
                                {discount > 0 && <span className="crm-muted">{inr(subtotal)} − {inr(discount)} = </span>}
                                <strong>{inr(total)}</strong> <span className="crm-muted">· {bats} bat{bats === 1 ? '' : 's'}</span>
                            </p>
                        </section>

                        <section className="crm-section">
                            <h3>Payment &amp; status</h3>
                            <div className="crm-tpl-row" role="radiogroup" aria-label="Payment">
                                {PAYMENT_MODES.map(m => (
                                    <button key={m.id} role="radio" aria-checked={paymentMode === m.id} className={`crm-chip ${paymentMode === m.id ? 'active' : ''}`} onClick={() => setPaymentMode(m.id)}>{m.label}</button>
                                ))}
                            </div>
                            <div className="mk-grid mk-grid--tight">
                                <label className="mk-field">
                                    <span>Order status</span>
                                    <select className="status-filter mk-input" value={status} onChange={e => setStatus(e.target.value)}>
                                        {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                    </select>
                                </label>
                                <label className="mk-field">
                                    <span>Sale date</span>
                                    <input className="mk-input" type="date" max={today()} value={date} onChange={e => setDate(e.target.value)} />
                                </label>
                            </div>
                        </section>

                        <section className="crm-section">
                            <h3>Where did they come from?</h3>
                            <div className="mk-grid mk-grid--tight">
                                <label className="mk-field">
                                    <span>Ad code in their message</span>
                                    <input className="mk-input" value={adCode} onChange={e => setAdCode(e.target.value.toUpperCase())} placeholder="e.g. L2" />
                                </label>
                                <label className="mk-field">
                                    <span>Ref code in their message</span>
                                    <input className="mk-input" value={ref} onChange={e => setRef(e.target.value.toUpperCase())} placeholder="e.g. WS-4X7KQ2" />
                                </label>
                            </div>
                            {adCode && (codeCampaign
                                ? <p className="crm-ok">Code {normalizeCode(adCode)} → campaign “{codeCampaign.name}”</p>
                                : <p className="crm-warn">No campaign uses code {normalizeCode(adCode)} — add it under Marketing → Campaigns.</p>)}
                            {trail && (
                                trail.resolved
                                    ? <p className="crm-ok">Found their website visit ({trail.ref}): {describeTouch(trail.touch)}</p>
                                    : <p className="crm-muted">Found their website visit ({trail.ref}) — they came to the site directly.</p>
                            )}
                            <div className="crm-tpl-row" role="radiogroup" aria-label="Source">
                                <button role="radio" aria-checked={!source} className={`crm-chip ${!source ? 'active' : ''}`} onClick={() => { setSource(''); setCampaignId(''); }}>
                                    {trail?.resolved ? 'Use what we found' : 'Not sure'}
                                </button>
                                {SOURCES.filter(s => s.pickable).map(s => (
                                    <button key={s.id} role="radio" aria-checked={source === s.id} className={`crm-chip ${source === s.id ? 'active' : ''}`} onClick={() => setSource(s.id)}>{s.label}</button>
                                ))}
                            </div>
                            {isPaidSource(source) && (
                                <label className="mk-field">
                                    <span>Which campaign? (optional)</span>
                                    <select className="status-filter mk-input" value={campaignId} onChange={e => setCampaignId(e.target.value)}>
                                        <option value="">Don’t know</option>
                                        {paidCampaigns.map(c => <option key={c.id} value={c.id}>{c.name}{c.code ? ` (${c.code})` : ''}</option>)}
                                    </select>
                                </label>
                            )}
                            <p className="crm-muted">This sale will count as: <strong>{willCountAs}</strong></p>
                        </section>

                        <section className="crm-section">
                            <h3>Notes</h3>
                            <textarea className="crm-textarea" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Bat weight, size, delivery promise…" />
                            <label className="crm-check">
                                <input type="checkbox" checked={sendToMeta && marketing.metaConfigured && !tooOldForMeta} disabled={!marketing.metaConfigured || tooOldForMeta} onChange={e => setSendToMeta(e.target.checked)} />
                                Tell Meta about this sale — helps your ads find more buyers like this one
                            </label>
                            {!marketing.metaConfigured && <p className="crm-muted">Meta isn’t connected on the server yet.</p>}
                            {marketing.metaConfigured && tooOldForMeta && <p className="crm-muted">Meta only accepts sales from the last 7 days.</p>}
                        </section>

                        {error && <p className="crm-warn" role="alert">{error}</p>}
                        <div className="crm-save-row">
                            <button className="btn crm-btn-wa" onClick={save} disabled={saving}>
                                {saving ? 'Saving…' : `Save sale · ${inr(total)}`}
                            </button>
                            <button className="crm-linkbtn" onClick={onClose}>Cancel</button>
                        </div>
                    </div>
                )}
            </aside>
        </div>
    );
};
