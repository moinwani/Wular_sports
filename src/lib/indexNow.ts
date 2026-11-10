/**
 * IndexNow: tells Bing (and through it ChatGPT search, Copilot, DuckDuckGo
 * and Yandex) the moment a page is added or changed, instead of waiting days
 * for their crawlers to come back. Free; needs no account — the key file at
 * /<key>.txt proves the site is ours.
 *
 * Runs on the server only, and only on the live site.
 */
export const INDEXNOW_KEY = '05f1c1f7cca72f6d6d8a2e97f8886c0e';
const HOST = 'wularsports.com';

/** Submit page paths ("/product/x") — never throws, never holds a request for long */
export async function submitToIndexNow(paths: string[]): Promise<{ ok: boolean; count: number; status?: number }> {
    const urlList = [...new Set(paths)].filter(p => p.startsWith('/')).map(p => `https://${HOST}${p === '/' ? '' : p}`);
    if (!urlList.length) return { ok: true, count: 0 };
    // Preview deployments and local runs must not announce pages
    if (process.env.VERCEL_ENV !== 'production') return { ok: false, count: 0 };
    try {
        const res = await fetch('https://api.indexnow.org/indexnow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({ host: HOST, key: INDEXNOW_KEY, keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`, urlList }),
            signal: AbortSignal.timeout(4000),
        });
        if (!res.ok) console.error('IndexNow rejected the submission:', res.status);
        return { ok: res.ok, count: urlList.length, status: res.status };
    } catch (err: any) {
        console.error('IndexNow unreachable:', err?.message);
        return { ok: false, count: urlList.length };
    }
}
