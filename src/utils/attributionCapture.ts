import { Attribution, Touch, classifyReferrer } from '../lib/marketing';
import { getVisitorRef } from './helpers';

/**
 * Remembers where this visitor came from (ad link tags, Meta/Google click
 * ids, or the site that referred them), so a sale days later — on the
 * website or over WhatsApp via the visitor's Ref code — can still be
 * credited to the ad that brought them.
 *
 * Stored in localStorage: the first visit (kept 90 days) and the latest one.
 * Visits with no source (typing the URL, moving between our own pages) never
 * overwrite a known source.
 */

const KEY = 'ws_attr';
const FBC_KEY = 'ws_fbc';
const OPPREF_KEY = 'ws_oppref';
/** ChatGPT ads credit a click for 30 days */
const OPPREF_MS = 30 * 86400000;
const KEEP_MS = 90 * 86400000;
const PARAMS: [keyof Touch, string][] = [
    ['source', 'utm_source'], ['medium', 'utm_medium'], ['campaign', 'utm_campaign'],
    ['content', 'utm_content'], ['term', 'utm_term'], ['fbclid', 'fbclid'], ['gclid', 'gclid'],
];

const read = (): { first?: Touch; last?: Touch } => {
    try {
        const v = JSON.parse(localStorage.getItem(KEY) || '{}');
        if (!v || typeof v !== 'object') return {};
        // Each visit expires on its own — an old first visit must not wipe a recent ad click
        const fresh = (t?: Touch) => {
            const at = Date.parse(t?.at || '');
            return t && (isNaN(at) || Date.now() - at <= KEEP_MS) ? t : undefined;
        };
        const first = fresh(v.first);
        const last = fresh(v.last);
        return { ...(first ? { first } : {}), ...(last ? { last } : {}) };
    } catch {
        return {};
    }
};

const cookie = (name: string) => {
    try {
        const hit = document.cookie.split('; ').find(c => c.startsWith(name + '='));
        return hit ? decodeURIComponent(hit.slice(name.length + 1)) : '';
    } catch {
        return '';
    }
};

/** Call on every page load. */
export const captureAttribution = () => {
    if (typeof window === 'undefined') return;
    try {
        const url = new URL(window.location.href);
        // ChatGPT ad click id — our own copy, in case the OpenAI pixel is blocked
        const oppref = url.searchParams.get('oppref');
        if (oppref) localStorage.setItem(OPPREF_KEY, JSON.stringify({ v: oppref.slice(0, 1000), at: Date.now() }));
        const t: Touch = {};
        for (const [k, q] of PARAMS) {
            const v = url.searchParams.get(q);
            if (v) t[k] = v.slice(0, 200);
        }
        const ref = document.referrer;
        const external = classifyReferrer(ref) !== null;
        if (!Object.keys(t).length && !external) return;

        if (external) t.referrer = ref.slice(0, 300);
        t.landing = url.pathname.slice(0, 300);
        t.at = new Date().toISOString();

        const cur = read();
        localStorage.setItem(KEY, JSON.stringify({ first: cur.first || t, last: t }));
        // Same format the Meta pixel uses for its _fbc cookie
        if (t.fbclid) localStorage.setItem(FBC_KEY, `fb.1.${Date.now()}.${t.fbclid}`);

        if (window.dataLayer && (t.source || t.campaign)) {
            window.dataLayer.push({
                event: 'utm_captured',
                utm_source: t.source, utm_medium: t.medium, utm_campaign: t.campaign,
                utm_content: t.content, utm_term: t.term,
            });
        }
    } catch {
        // Storage blocked (private mode) — attribution is best-effort
    }
};

/** Everything we know about where this visitor came from. */
export const getAttribution = (): Attribution => {
    if (typeof window === 'undefined') return {};
    const a: Attribution = { ...read() };
    const fbp = cookie('_fbp');
    let fbc = cookie('_fbc');
    if (!fbc) {
        try { fbc = localStorage.getItem(FBC_KEY) || ''; } catch { /* blocked */ }
    }
    if (fbp) a.fbp = fbp;
    if (fbc) a.fbc = fbc;
    let oppref = cookie('__oppref');
    if (!oppref) {
        try {
            const o = JSON.parse(localStorage.getItem(OPPREF_KEY) || 'null');
            if (o?.v && Date.now() - Number(o.at) <= OPPREF_MS) oppref = String(o.v);
        } catch { /* blocked */ }
    }
    if (oppref) a.oppref = oppref;
    const obref = cookie('__obref');
    if (obref) a.obref = obref;
    const ref = getVisitorRef();
    if (ref) a.ref = ref;
    return a;
};

/**
 * Save this visitor's source on the server, keyed by their Ref code — so
 * when they message us on WhatsApp, the admin panel can see which ad
 * brought them. Called when a visitor taps a WhatsApp button or starts
 * checkout. Best-effort; never throws.
 */
export const syncVisitor = async (event: 'whatsapp' | 'checkout'): Promise<void> => {
    try {
        const a = getAttribution();
        if (!a.ref) return;
        const { ensureAuthenticated, getCurrentUser } = await import('../services/auth');
        await ensureAuthenticated();
        const user = getCurrentUser();
        if (!user) return;

        // Checkout saves fire on every field — only send when something changed
        const stamp = `${user.uid}|${a.last?.at || ''}|${a.fbc || ''}`;
        if (event === 'checkout') {
            try { if (localStorage.getItem('ws_attr_synced') === stamp) return; } catch { /* blocked */ }
        }

        const res = await fetch('/api/visitor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
            body: JSON.stringify({ event, attribution: a }),
            // The WhatsApp app is opening — let the request finish in the background
            keepalive: true,
        });
        if (res.ok) {
            try { localStorage.setItem('ws_attr_synced', stamp); } catch { /* blocked */ }
        }
    } catch {
        // Best-effort only
    }
};
