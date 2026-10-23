import { FC, ReactNode, useMemo, useState } from 'react';
import { useAdminData } from '../../hooks/useAdminData';
import { marketingAction } from '../../services/admin';
import { META_URL_PARAMS, classifyTouch, whatsappAdMessage } from '../../lib/marketing';
import { toDate } from '../../services/customers';
import { Icon } from '../common/Icon';

/** A line of text with a Copy button. */
export const CopyBox: FC<{ label: string; text: string }> = ({ label, text }) => {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            window.prompt('Copy this:', text);
        }
    };
    return (
        <div className="mk-copy">
            <span className="mk-copy__label">{label}</span>
            <div className="mk-copy__row">
                <code>{text}</code>
                <button className="btn" onClick={copy}><Icon name={copied ? 'fa-check' : 'fa-copy'} /> {copied ? 'Copied' : 'Copy'}</button>
            </div>
        </div>
    );
};

const Check: FC<{ ok: boolean; children: ReactNode }> = ({ ok, children }) => (
    <li className={ok ? 'ok' : 'todo'}>
        <Icon name={ok ? 'fa-check-circle' : 'fa-exclamation-circle'} />
        <span>{children}</span>
    </li>
);

export const MarketingSetup: FC = () => {
    const { marketing, orders } = useAdminData();
    const [testCode, setTestCode] = useState('');
    const [test, setTest] = useState<{ busy: boolean; text?: string; ok?: boolean }>({ busy: false });
    const [now] = useState(() => Date.now());

    const health = useMemo(() => {
        const recent = orders.filter(o => (toDate(o.createdAt)?.getTime() || 0) > now - 30 * 86400000);
        const web = recent.filter(o => o.channel === 'website' || (!o.channel && o.source !== 'whatsapp_pre_website'));
        const tagged = web.filter(o => classifyTouch(o.attribution?.last) === 'meta_ads' || classifyTouch(o.attribution?.first) === 'meta_ads');
        const recorded = recent.filter(o => o.recordedBy === 'admin');
        const lastSpend = marketing.spend.reduce((m, s) => (s.to > m ? s.to : m), '');
        return {
            webOrders: web.length,
            taggedOrders: tagged.length,
            recordedSales: recorded.length,
            codes: marketing.campaigns.filter(c => c.code && c.status === 'active').length,
            lastSpend,
        };
    }, [orders, marketing, now]);

    const sendTest = async () => {
        setTest({ busy: true });
        const r = await marketingAction('metaTest', { testCode }).catch(() => ({ error: 'Could not reach the server.' }));
        if (r.error) return setTest({ busy: false, ok: false, text: r.error });
        setTest({
            busy: false,
            ok: r.status === 'sent',
            text: r.status === 'sent' ? 'Sent! Check the Test events tab in Meta Events Manager — a Purchase should appear within a minute.' : `${r.status}: ${r.reason}`,
        });
    };

    const exampleCode = marketing.campaigns.find(c => c.code)?.code || 'L2';

    return (
        <div className="mk-stack">
            <section className="an-panel">
                <div className="an-head"><h2>Tracking health</h2><span className="an-note">last 30 days</span></div>
                <ul className="mk-checks">
                    <Check ok={marketing.metaConfigured}>
                        {marketing.metaConfigured
                            ? 'Meta is connected — paid website orders and the WhatsApp sales you record are reported to Meta from the server.'
                            : 'Meta isn’t connected on the server (META_CAPI_ACCESS_TOKEN missing in Vercel).'}
                    </Check>
                    <Check ok={health.taggedOrders > 0}>
                        {health.taggedOrders} of {health.webOrders} website orders came from a tagged Meta ad link.
                        {health.taggedOrders === 0 && ' Add the URL parameters below to your website ads.'}
                    </Check>
                    <Check ok={health.codes > 0}>
                        {health.codes ? `${health.codes} running campaign${health.codes === 1 ? ' has' : 's have'} a WhatsApp code.` : 'No running campaign has a WhatsApp code yet.'}
                    </Check>
                    <Check ok={health.recordedSales > 0}>
                        {health.recordedSales} WhatsApp sale{health.recordedSales === 1 ? '' : 's'} recorded.
                        {health.recordedSales === 0 && ' Record every WhatsApp sale so it counts towards your ads.'}
                    </Check>
                    <Check ok={!!health.lastSpend && Date.parse(health.lastSpend) > now - 10 * 86400000}>
                        {health.lastSpend ? `Ad spend entered up to ${new Date(`${health.lastSpend}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}.` : 'No ad spend entered yet.'} Import it from Ads Manager once a week.
                    </Check>
                </ul>
            </section>

            <section className="an-panel">
                <div className="an-head"><h2>1 · Ads that open the website</h2></div>
                <p className="mk-p">In Ads Manager, open each ad → <strong>Destination</strong> → <strong>URL parameters</strong> → paste this. Every visit then carries the campaign, ad set and ad name — and so does the order.</p>
                <CopyBox label="URL parameters" text={META_URL_PARAMS} />
                <p className="mk-p crm-muted">If they tap the WhatsApp button on the site instead of buying, their message carries a <strong>Ref code</strong> (like WS-4X7KQ2) that links back to that ad.</p>
            </section>

            <section className="an-panel">
                <div className="an-head"><h2>2 · Ads that open WhatsApp directly</h2></div>
                <ol className="mk-steps">
                    <li>Create the campaign in <strong>Campaigns &amp; spend</strong> and give it a short code, e.g. <code>{exampleCode}</code>.</li>
                    <li>In Ads Manager, set the ad’s WhatsApp <strong>pre-filled message</strong> to include that code:</li>
                </ol>
                <CopyBox label="Pre-filled message" text={whatsappAdMessage(exampleCode)} />
                <ol className="mk-steps" start={3}>
                    <li>When the chat turns into a sale, press <strong>Record WhatsApp sale</strong> and type the code. The sale is credited to that campaign and sent to Meta, matched by the customer’s phone number.</li>
                </ol>
            </section>

            <section className="an-panel">
                <div className="an-head"><h2>3 · What the ads cost</h2></div>
                <p className="mk-p">Once a week: Ads Manager → Campaigns → pick the dates → <strong>Reports → Export table data → CSV</strong>, then import it under <strong>Campaigns &amp; spend</strong>. ROAS and cost per customer appear on the Overview.</p>
            </section>

            <section className="an-panel">
                <div className="an-head"><h2>Test the Meta connection</h2></div>
                <p className="mk-p">Meta Events Manager → your pixel → <strong>Test events</strong> → copy the test code (like TEST12345) and send a test purchase. It won’t count as a real sale.</p>
                <div className="mk-copy__row">
                    <input className="mk-input" value={testCode} onChange={e => setTestCode(e.target.value.trim())} placeholder="TEST12345" aria-label="Meta test event code" />
                    <button className="btn" onClick={sendTest} disabled={test.busy || !testCode || !marketing.metaConfigured}>{test.busy ? 'Sending…' : 'Send test purchase'}</button>
                </div>
                {test.text && <p className={test.ok ? 'crm-ok' : 'crm-warn'}>{test.text}</p>}
            </section>
        </div>
    );
};
