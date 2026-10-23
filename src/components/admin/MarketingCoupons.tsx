import { FC, useMemo, useState } from 'react';
import { useAdminData } from '../../hooks/useAdminData';
import { marketingAction } from '../../services/admin';
import { isPaid } from '../../services/customers';
import { CouponDef, CouponType, couponLabel, couponLive, normalizeCode } from '../../lib/marketing';
import { inr } from './format';
import { Icon } from '../common/Icon';

const blank = (): CouponDef => ({ code: '', type: 'per_bat', value: 100, active: true, expiresAt: '', note: '' });

export const MarketingCoupons: FC = () => {
    const { marketing, setMarketing, orders } = useAdminData();
    const [editing, setEditing] = useState<CouponDef | null>(null);
    const [isNew, setIsNew] = useState(false);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

    const usage = useMemo(() => {
        const m = new Map<string, { orders: number; revenue: number; discount: number }>();
        for (const o of orders.filter(isPaid)) {
            const code = String(o.couponCode || '').toUpperCase();
            if (!code) continue;
            const u = m.get(code) || { orders: 0, revenue: 0, discount: 0 };
            u.orders++;
            u.revenue += o.total || 0;
            u.discount += o.discount || 0;
            m.set(code, u);
        }
        return m;
    }, [orders]);

    const campaignFor = (code: string) => marketing.campaigns.find(c => c.couponCode === code)?.name;
    const coupons = [...marketing.coupons].sort((a, b) => Number(couponLive(b)) - Number(couponLive(a)) || a.code.localeCompare(b.code));

    const save = async (c: CouponDef, okText: string) => {
        setBusy(true);
        setMsg(null);
        const res = await marketingAction('saveCoupon', { coupon: c }).catch(() => ({ error: 'Could not save — check your connection.' }));
        setBusy(false);
        if (res.error) {
            setMsg({ ok: false, text: res.error });
            return false;
        }
        const saved = { ...(res.coupon as CouponDef), builtIn: c.builtIn };
        setMarketing(m => ({ ...m, coupons: [...m.coupons.filter(x => x.code !== saved.code), saved] }));
        setMsg({ ok: true, text: okText });
        return true;
    };

    const remove = async (c: CouponDef) => {
        if (!confirm(`Delete coupon ${c.code}? Customers won’t be able to use it.`)) return;
        setBusy(true);
        const res = await marketingAction('deleteCoupon', { code: c.code }).catch(() => ({ error: 'Could not delete.' }));
        setBusy(false);
        if (res.error) return setMsg({ ok: false, text: res.error });
        setMarketing(m => ({ ...m, coupons: m.coupons.filter(x => x.code !== c.code) }));
        setMsg({ ok: true, text: `Deleted ${c.code}` });
    };

    const status = (c: CouponDef) => (couponLive(c) ? 'Live' : !c.active ? 'Switched off' : 'Expired');

    return (
        <div className="mk-stack">
            {msg && <p className={msg.ok ? 'crm-ok' : 'crm-warn'} role="status">{msg.text}</p>}
            <section className="an-panel">
                <div className="an-head">
                    <h2>Coupons</h2>
                    <button className="btn" onClick={() => { setEditing(blank()); setIsNew(true); }}><Icon name="fa-plus" /> New coupon</button>
                </div>
                <p className="an-hint">Give each influencer or campaign its own code (e.g. RAHUL150) and link it to the campaign — every order using it is then credited to them automatically.</p>

                {editing && (
                    <div className="mk-form">
                        <div className="mk-grid">
                            <label className="mk-field">
                                <span>Code</span>
                                <input className="mk-input mono" value={editing.code} disabled={!isNew} onChange={e => setEditing({ ...editing, code: normalizeCode(e.target.value) })} placeholder="DIWALI200" autoFocus />
                            </label>
                            <label className="mk-field">
                                <span>Discount type</span>
                                <select className="status-filter mk-input" value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value as CouponType })}>
                                    <option value="per_bat">₹ off per bat</option>
                                    <option value="percent">% off the order</option>
                                </select>
                            </label>
                            <label className="mk-field">
                                <span>{editing.type === 'percent' ? 'Percent off' : '₹ off each bat'}</span>
                                <input className="mk-input" inputMode="numeric" value={String(editing.value || '')} onChange={e => setEditing({ ...editing, value: Number(e.target.value.replace(/\D/g, '')) || 0 })} />
                            </label>
                            <label className="mk-field">
                                <span>Last day valid (optional)</span>
                                <input className="mk-input" type="date" value={editing.expiresAt || ''} onChange={e => setEditing({ ...editing, expiresAt: e.target.value })} />
                            </label>
                            <label className="mk-field mk-span2">
                                <span>Note (who it’s for)</span>
                                <input className="mk-input" value={editing.note || ''} onChange={e => setEditing({ ...editing, note: e.target.value })} placeholder="e.g. Instagram creator @kashmircricket" />
                            </label>
                        </div>
                        <label className="crm-check">
                            <input type="checkbox" checked={editing.active} onChange={e => setEditing({ ...editing, active: e.target.checked })} /> Live — customers can use it now
                        </label>
                        <div className="crm-save-row">
                            <button
                                className="btn"
                                disabled={busy || editing.code.length < 3}
                                onClick={async () => { if (await save(editing, `Saved ${editing.code}`)) setEditing(null); }}
                            >
                                {busy ? 'Saving…' : 'Save coupon'}
                            </button>
                            <button className="crm-linkbtn" onClick={() => setEditing(null)}>Cancel</button>
                        </div>
                    </div>
                )}

                <div className="scroll">
                    <table className="admin-table">
                        <thead>
                            <tr><th>Code</th><th>Offer</th><th>Status</th><th className="num">Orders</th><th className="num">Sales</th><th className="num">Discount given</th><th>Campaign</th><th></th></tr>
                        </thead>
                        <tbody>
                            {coupons.map(c => {
                                const u = usage.get(c.code);
                                return (
                                    <tr key={c.code}>
                                        <td className="mono">{c.code}{c.note && <div className="crm-muted">{c.note}</div>}</td>
                                        <td>{couponLabel(c)}{c.expiresAt && <div className="crm-muted">until {new Date(`${c.expiresAt}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>}</td>
                                        <td>{couponLive(c) ? <span className="crm-ok">{status(c)}</span> : <span className="crm-muted">{status(c)}</span>}</td>
                                        <td className="num">{u?.orders || 0}</td>
                                        <td className="num">{u ? inr(u.revenue) : '—'}</td>
                                        <td className="num">{u ? inr(u.discount) : '—'}</td>
                                        <td>{campaignFor(c.code) || <span className="crm-muted">—</span>}</td>
                                        <td className="mk-actions">
                                            <button className="crm-linkbtn" disabled={busy} onClick={() => save({ ...c, active: !c.active }, `${c.code} ${c.active ? 'switched off' : 'is live'}`)}>
                                                {c.active ? 'Switch off' : 'Switch on'}
                                            </button>
                                            <button className="crm-linkbtn" onClick={() => { setEditing({ ...c, expiresAt: c.expiresAt || '', note: c.note || '' }); setIsNew(false); }}>Edit</button>
                                            {!c.builtIn && (
                                                <button className="crm-linkbtn" disabled={busy} onClick={() => remove(c)} aria-label={`Delete ${c.code}`}><Icon name="fa-trash-alt" /></button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};
