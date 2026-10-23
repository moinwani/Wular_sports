import { FC, useState } from 'react';
import { useAdminData } from '../../hooks/useAdminData';
import { marketingAction } from '../../services/admin';
import { describeTouch } from '../../services/marketing';
import { SOURCES, isPaidSource, sourceDef } from '../../lib/marketing';

/** "Came from" line for an order, with a picker to set or correct it. */
export const OrderSource: FC<{ order: any; compact?: boolean }> = ({ order, compact }) => {
    const { attributed, marketing } = useAdminData();
    const a = attributed.find(x => x.order.id === order.id);
    const manual = order.attribution?.manual;
    const [source, setSource] = useState<string>(manual?.source || '');
    const [campaignId, setCampaignId] = useState<string>(manual?.campaignId || '');
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState('');

    const save = async () => {
        setBusy(true);
        setMsg('');
        const res = await marketingAction('setOrderSource', { orderId: order.id, source, campaignId: isPaidSource(source) ? campaignId : '' })
            .catch(() => ({ error: 'Could not save — check your connection.' }));
        setBusy(false);
        setMsg(res.error ? `✗ ${res.error}` : '✓ Saved');
    };

    const trail = order.attribution?.last || order.attribution?.first;
    const changed = source !== (manual?.source || '') || campaignId !== (manual?.campaignId || '');

    return (
        <div className={`mk-source ${compact ? 'mk-source--compact' : ''}`}>
            {a ? (
                <p>
                    <strong>{sourceDef(a.source).label}</strong>
                    {a.campaignName && <> · {a.campaignName}</>}
                    <span className="crm-muted"> ({a.basis})</span>
                </p>
            ) : (
                <p className="crm-muted">Counted once the order is paid.</p>
            )}
            {!compact && trail && <p className="crm-muted">Website visit: {describeTouch(trail)}</p>}
            <div className="mk-source__edit">
                <select className="status-filter mk-input" value={source} onChange={e => setSource(e.target.value)} aria-label="Where this customer came from">
                    <option value="">Work it out automatically</option>
                    {SOURCES.filter(s => s.pickable).map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                {isPaidSource(source) && (
                    <select className="status-filter mk-input" value={campaignId} onChange={e => setCampaignId(e.target.value)} aria-label="Campaign">
                        <option value="">Campaign: don’t know</option>
                        {marketing.campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                )}
                <button className="btn" onClick={save} disabled={busy || !changed}>{busy ? 'Saving…' : 'Save'}</button>
                {msg && <span className={msg.startsWith('✓') ? 'crm-ok' : 'crm-warn'}>{msg}</span>}
            </div>
            {!compact && order.metaPurchase && (
                <p className="crm-muted">
                    Meta: {order.metaPurchase.status === 'sent' ? '✓ purchase reported' : `${order.metaPurchase.status} — ${order.metaPurchase.reason || ''}`}
                </p>
            )}
        </div>
    );
};
