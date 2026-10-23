import { FC, useMemo, useState } from 'react';
import { useAdminData } from '../../hooks/useAdminData';
import { marketingAction } from '../../services/admin';
import { Campaign, PLATFORMS, Platform, SpendEntry, normalizeCode, whatsappAdMessage } from '../../lib/marketing';
import { inr } from './format';
import { CopyBox } from './MarketingSetup';
import { Icon } from '../common/Icon';

/* ───────────── Meta Ads Manager CSV ───────────── */

/** Minimal CSV parser: quoted fields, escaped quotes, CRLF. */
export const parseCsv = (text: string): string[][] => {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let quoted = false;
    const s = text.replace(/^﻿/, '');
    for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (quoted) {
            if (ch === '"' && s[i + 1] === '"') { cell += '"'; i++; }
            else if (ch === '"') quoted = false;
            else cell += ch;
        } else if (ch === '"') quoted = true;
        else if (ch === ',') { row.push(cell); cell = ''; }
        else if (ch === '\n' || ch === '\r') {
            if (ch === '\r' && s[i + 1] === '\n') i++;
            row.push(cell); cell = '';
            if (row.some(c => c.trim())) rows.push(row);
            row = [];
        } else cell += ch;
    }
    row.push(cell);
    if (row.some(c => c.trim())) rows.push(row);
    return rows;
};

export interface ImportRow { campaignName: string; from: string; to: string; amount: number; results?: number; }

const toDay = (v: string): string | null => {
    const t = v.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
    const dmy = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
    if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
    const d = new Date(t);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

/**
 * Read an Ads Manager export (Reports → Export table data → .csv).
 * Needs "Campaign name" and "Amount spent"; dates come from "Day" (daily
 * breakdown) or "Reporting starts/ends". Rows for the same campaign and
 * period (e.g. one per ad set) are added together.
 */
export const parseMetaExport = (text: string): { rows: ImportRow[]; error?: string } => {
    const table = parseCsv(text);
    if (table.length < 2) return { rows: [], error: 'The file looks empty.' };
    const head = table[0].map(h => h.trim().toLowerCase());
    const col = (re: RegExp) => head.findIndex(h => re.test(h));
    const cName = col(/^campaign name$/);
    const cSpend = col(/^amount spent/);
    const cDay = col(/^day$/);
    const cStart = col(/^reporting starts$/);
    const cEnd = col(/^reporting ends$/);
    const cResults = col(/^results$/);
    if (cName < 0 || cSpend < 0) return { rows: [], error: 'Couldn’t find the “Campaign name” and “Amount spent” columns. Export from Ads Manager at campaign level as CSV.' };
    if (cDay < 0 && (cStart < 0 || cEnd < 0)) return { rows: [], error: 'Couldn’t find the dates — keep the “Reporting starts” and “Reporting ends” columns in the export.' };

    const merged = new Map<string, ImportRow>();
    for (const r of table.slice(1)) {
        const name = (r[cName] || '').trim();
        if (!name) continue;
        const from = toDay(cDay >= 0 ? r[cDay] || '' : r[cStart] || '');
        const to = toDay(cDay >= 0 ? r[cDay] || '' : r[cEnd] || '');
        const amount = Number(String(r[cSpend] || '').replace(/[^\d.]/g, ''));
        if (!from || !to || !Number.isFinite(amount)) continue;
        const results = cResults >= 0 ? Number(String(r[cResults] || '').replace(/[^\d.]/g, '')) : NaN;
        const key = `${name.toLowerCase()}|${from}|${to}`;
        const cur = merged.get(key) || { campaignName: name, from, to, amount: 0 };
        cur.amount += amount;
        if (Number.isFinite(results)) cur.results = (cur.results || 0) + results;
        merged.set(key, cur);
    }
    const rows = [...merged.values()].filter(r => r.amount > 0 || (r.results || 0) > 0);
    return rows.length ? { rows } : { rows: [], error: 'No rows with spend found in this file.' };
};

/* ───────────── Screen ───────────── */

const dayOffset = (days: number) => new Date(Date.now() + 5.5 * 3600000 - days * 86400000).toISOString().slice(0, 10);
const blankCampaign = (): Partial<Campaign> => ({ name: '', platform: 'meta', code: '', couponCode: '', utmCampaign: '', status: 'active' });
const fmtDay = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export const MarketingCampaigns: FC = () => {
    const { marketing, setMarketing } = useAdminData();
    const [editing, setEditing] = useState<Partial<Campaign> | null>(null);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [busy, setBusy] = useState(false);
    const [spend, setSpend] = useState({ campaignId: '', from: dayOffset(7), to: dayOffset(1), amount: '', results: '' });
    const [importRows, setImportRows] = useState<ImportRow[] | null>(null);
    const [showAllSpend, setShowAllSpend] = useState(false);

    const campaigns = useMemo(
        () => [...marketing.campaigns].sort((a, b) => (a.status === b.status ? a.name.localeCompare(b.name) : a.status === 'active' ? -1 : 1)),
        [marketing.campaigns]
    );
    const nameOf = (id: string) => marketing.campaigns.find(c => c.id === id)?.name || 'Deleted campaign';
    const spendRows = useMemo(() => [...marketing.spend].sort((a, b) => b.from.localeCompare(a.from)), [marketing.spend]);

    const run = async (action: string, payload: Record<string, unknown>, ok: string) => {
        setBusy(true);
        setMsg(null);
        const res = await marketingAction(action, payload).catch(() => ({ error: 'Could not save — check your connection.' }));
        setBusy(false);
        setMsg(res.error ? { ok: false, text: res.error } : { ok: true, text: ok });
        return res.error ? null : res;
    };

    const saveCampaign = async () => {
        if (!editing) return;
        const res = await run('saveCampaign', { campaign: editing }, `Saved “${editing.name}”`);
        if (!res) return;
        const saved = res.campaign as Campaign;
        setMarketing(m => ({ ...m, campaigns: [...m.campaigns.filter(c => c.id !== saved.id), saved] }));
        setEditing(null);
    };

    const deleteCampaign = async (c: Campaign) => {
        if (!confirm(`Delete “${c.name}” and its ad spend? Sales stay, but lose the campaign link.`)) return;
        if (!(await run('deleteCampaign', { id: c.id }, `Deleted “${c.name}”`))) return;
        setMarketing(m => ({ ...m, campaigns: m.campaigns.filter(x => x.id !== c.id), spend: m.spend.filter(s => s.campaignId !== c.id) }));
    };

    const applySpend = (res: any) => {
        const saved = res.spend as SpendEntry[];
        const created = (res.created || []) as Campaign[];
        setMarketing(m => ({
            ...m,
            campaigns: [...m.campaigns, ...created],
            spend: [...m.spend.filter(s => !saved.some(x => x.id === s.id)), ...saved],
        }));
    };

    const addSpend = async () => {
        if (!spend.campaignId) return setMsg({ ok: false, text: 'Pick the campaign this money was spent on.' });
        if (!(Number(spend.amount) > 0)) return setMsg({ ok: false, text: 'Enter how much was spent.' });
        const res = await run('saveSpend', {
            via: 'manual',
            entries: [{ campaignId: spend.campaignId, from: spend.from, to: spend.to, amount: Number(spend.amount), results: spend.results === '' ? undefined : Number(spend.results) }],
        }, 'Ad spend saved');
        if (!res) return;
        applySpend(res);
        setSpend(s => ({ ...s, amount: '', results: '' }));
    };

    const onFile = async (file?: File | null) => {
        if (!file) return;
        setMsg(null);
        const { rows, error } = parseMetaExport(await file.text());
        if (error) return setMsg({ ok: false, text: error });
        setImportRows(rows);
    };

    const confirmImport = async () => {
        if (!importRows) return;
        const res = await run('saveSpend', { via: 'csv', entries: importRows }, `Imported ${importRows.length} row${importRows.length === 1 ? '' : 's'} of ad spend`);
        if (!res) return;
        applySpend(res);
        setImportRows(null);
    };

    return (
        <div className="mk-stack">
            {msg && <p className={msg.ok ? 'crm-ok' : 'crm-warn'} role="status">{msg.text}</p>}

            <section className="an-panel">
                <div className="an-head">
                    <h2>Campaigns</h2>
                    <button className="btn" onClick={() => setEditing(blankCampaign())}><Icon name="fa-plus" /> New campaign</button>
                </div>
                <p className="an-hint">One per ad campaign or influencer deal. Give WhatsApp ads a short <strong>code</strong> — customers send it in their first message, so you know which ad they saw.</p>

                {editing && (
                    <div className="mk-form">
                        <div className="mk-grid">
                            <label className="mk-field mk-span2">
                                <span>Campaign name (same as in Ads Manager)</span>
                                <input className="mk-input" value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Diwali Legacy 2.0 – WhatsApp" autoFocus />
                            </label>
                            <label className="mk-field">
                                <span>Platform</span>
                                <select className="status-filter mk-input" value={editing.platform} onChange={e => setEditing({ ...editing, platform: e.target.value as Platform })}>
                                    {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                                </select>
                            </label>
                            <label className="mk-field">
                                <span>WhatsApp ad code</span>
                                <input className="mk-input" value={editing.code || ''} onChange={e => setEditing({ ...editing, code: normalizeCode(e.target.value).slice(0, 12) })} placeholder="e.g. L2" />
                            </label>
                            <label className="mk-field">
                                <span>Coupon for this campaign</span>
                                <select className="status-filter mk-input" value={editing.couponCode || ''} onChange={e => setEditing({ ...editing, couponCode: e.target.value })}>
                                    <option value="">None</option>
                                    {marketing.coupons.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                                </select>
                            </label>
                            <label className="mk-field">
                                <span>Status</span>
                                <select className="status-filter mk-input" value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value as Campaign['status'] })}>
                                    <option value="active">Running</option>
                                    <option value="paused">Paused</option>
                                    <option value="ended">Ended</option>
                                </select>
                            </label>
                        </div>
                        <details className="mk-more">
                            <summary>Advanced</summary>
                            <label className="mk-field">
                                <span>Name in website ad links (utm_campaign) — leave blank if it’s the campaign name</span>
                                <input className="mk-input" value={editing.utmCampaign || ''} onChange={e => setEditing({ ...editing, utmCampaign: e.target.value })} />
                            </label>
                        </details>
                        {editing.code && <CopyBox label="Pre-filled WhatsApp message for this ad" text={whatsappAdMessage(normalizeCode(editing.code))} />}
                        <div className="crm-save-row">
                            <button className="btn" onClick={saveCampaign} disabled={busy || !editing.name?.trim()}>{busy ? 'Saving…' : 'Save campaign'}</button>
                            <button className="crm-linkbtn" onClick={() => setEditing(null)}>Cancel</button>
                        </div>
                    </div>
                )}

                {campaigns.length ? (
                    <div className="scroll">
                        <table className="admin-table">
                            <thead><tr><th>Campaign</th><th>Platform</th><th>Code</th><th>Coupon</th><th>Status</th><th></th></tr></thead>
                            <tbody>
                                {campaigns.map(c => (
                                    <tr key={c.id}>
                                        <td>{c.name}</td>
                                        <td>{PLATFORMS.find(p => p.id === c.platform)?.label}</td>
                                        <td className="mono">{c.code || <span className="crm-muted">—</span>}</td>
                                        <td className="mono">{c.couponCode || <span className="crm-muted">—</span>}</td>
                                        <td>{c.status === 'active' ? 'Running' : c.status === 'paused' ? 'Paused' : 'Ended'}</td>
                                        <td className="mk-actions">
                                            <button className="crm-linkbtn" onClick={() => setEditing({ ...c })}>Edit</button>
                                            <button className="crm-linkbtn" onClick={() => deleteCampaign(c)} aria-label={`Delete ${c.name}`}><Icon name="fa-trash-alt" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : !editing && <p className="an-empty">No campaigns yet. Add one for each ad you run — or import your Ads Manager report below and they’re created for you.</p>}
            </section>

            <section className="an-panel">
                <div className="an-head"><h2>Ad spend</h2><span className="an-note">what you paid Meta / influencers</span></div>

                <div className="mk-import">
                    <div>
                        <strong>Import from Meta Ads Manager</strong>
                        <p className="crm-muted">Ads Manager → Campaigns → set the dates → Reports → Export table data → CSV. Importing the same dates again replaces them — nothing is counted twice.</p>
                    </div>
                    <label className="btn mk-file">
                        <Icon name="fa-download" /> Choose CSV file
                        <input type="file" accept=".csv,text/csv" onChange={e => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
                    </label>
                </div>

                {importRows && (
                    <div className="mk-form">
                        <p><strong>{importRows.length} row{importRows.length === 1 ? '' : 's'} found</strong> · {inr(importRows.reduce((t, r) => t + r.amount, 0))} total. New campaign names are added automatically.</p>
                        <div className="scroll">
                            <table className="admin-table">
                                <thead><tr><th>Campaign</th><th>Dates</th><th className="num">Spent</th><th className="num">Results</th></tr></thead>
                                <tbody>
                                    {importRows.slice(0, 50).map((r, i) => (
                                        <tr key={i}>
                                            <td>{r.campaignName}</td>
                                            <td>{r.from === r.to ? fmtDay(r.from) : `${fmtDay(r.from)} – ${fmtDay(r.to)}`}</td>
                                            <td className="num">{inr(r.amount)}</td>
                                            <td className="num">{r.results ?? '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="crm-save-row">
                            <button className="btn" onClick={confirmImport} disabled={busy}>{busy ? 'Importing…' : 'Import'}</button>
                            <button className="crm-linkbtn" onClick={() => setImportRows(null)}>Cancel</button>
                        </div>
                    </div>
                )}

                <div className="mk-form">
                    <strong>Or add it by hand</strong>
                    <div className="mk-grid mk-grid--spend">
                        <label className="mk-field">
                            <span>Campaign</span>
                            <select className="status-filter mk-input" value={spend.campaignId} onChange={e => setSpend({ ...spend, campaignId: e.target.value })}>
                                <option value="">Choose…</option>
                                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </label>
                        <label className="mk-field">
                            <span>From</span>
                            <input className="mk-input" type="date" value={spend.from} onChange={e => setSpend({ ...spend, from: e.target.value })} />
                        </label>
                        <label className="mk-field">
                            <span>To</span>
                            <input className="mk-input" type="date" value={spend.to} min={spend.from} onChange={e => setSpend({ ...spend, to: e.target.value })} />
                        </label>
                        <label className="mk-field">
                            <span>Amount spent ₹</span>
                            <input className="mk-input" inputMode="decimal" value={spend.amount} onChange={e => setSpend({ ...spend, amount: e.target.value.replace(/[^\d.]/g, '') })} placeholder="3500" />
                        </label>
                        <label className="mk-field">
                            <span>Results (chats / clicks)</span>
                            <input className="mk-input" inputMode="numeric" value={spend.results} onChange={e => setSpend({ ...spend, results: e.target.value.replace(/\D/g, '') })} placeholder="optional" />
                        </label>
                    </div>
                    <div className="crm-save-row">
                        <button className="btn" onClick={addSpend} disabled={busy || !campaigns.length}>Add spend</button>
                        {!campaigns.length && <span className="crm-muted">Create a campaign first.</span>}
                    </div>
                </div>

                {spendRows.length > 0 && (
                    <div className="scroll">
                        <table className="admin-table">
                            <thead><tr><th>Campaign</th><th>Dates</th><th className="num">Spent</th><th className="num">Results</th><th>Added</th><th></th></tr></thead>
                            <tbody>
                                {(showAllSpend ? spendRows : spendRows.slice(0, 15)).map(s => (
                                    <tr key={s.id}>
                                        <td>{nameOf(s.campaignId)}</td>
                                        <td>{s.from === s.to ? fmtDay(s.from) : `${fmtDay(s.from)} – ${fmtDay(s.to)}`}</td>
                                        <td className="num">{inr(s.amount)}</td>
                                        <td className="num">{s.results ?? '—'}</td>
                                        <td className="crm-muted">{s.via === 'csv' ? 'CSV import' : 'by hand'}</td>
                                        <td>
                                            <button
                                                className="crm-linkbtn"
                                                aria-label="Delete this spend entry"
                                                onClick={async () => {
                                                    if (!confirm('Delete this spend entry?')) return;
                                                    if (await run('deleteSpend', { id: s.id }, 'Spend entry deleted')) {
                                                        setMarketing(m => ({ ...m, spend: m.spend.filter(x => x.id !== s.id) }));
                                                    }
                                                }}
                                            >
                                                <Icon name="fa-trash-alt" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {spendRows.length > 15 && (
                            <div className="crm-more">
                                <button className="crm-linkbtn" onClick={() => setShowAllSpend(v => !v)}>{showAllSpend ? 'Show fewer' : `Show all ${spendRows.length}`}</button>
                            </div>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
};
