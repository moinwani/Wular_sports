import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { SEOHead } from '../src/components/common/SEOHead';
import ASSET_VERSIONS from '../src/data/assetVersions.json';

const AdminView = dynamic(() => import('../src/views/AdminView').then(m => ({ default: m.AdminView })), { ssr: false });

/*
 * Admin panel styles live in public/admin.css, so shoppers never download them
 * (they used to be about a quarter of the site's stylesheet). The file is added
 * after the site's own stylesheet — the same order as when it was one file —
 * and the panel appears once it has loaded, so it never shows unstyled.
 */
const ADMIN_CSS = `/admin.css?v=${(ASSET_VERSIONS as Record<string, string>)['public/admin.css'] || '1'}`;

function useAdminStyles(): boolean {
    const [ready, setReady] = useState(false);
    useEffect(() => {
        let link = document.querySelector<HTMLLinkElement>('link[data-admin-css]');
        if (!link) {
            link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = ADMIN_CSS;
            link.dataset.adminCss = '';
            document.head.appendChild(link);
        }
        const done = () => setReady(true);
        if (link.sheet) done();
        else {
            link.addEventListener('load', done, { once: true });
            link.addEventListener('error', done, { once: true });
        }
        return () => {
            link?.removeEventListener('load', done);
            link?.removeEventListener('error', done);
            // Leaving the admin panel (e.g. "view site"): drop its styles again
            link?.remove();
        };
    }, []);
    return ready;
}

export default function AdminPage() {
    const ready = useAdminStyles();
    return (
        <>
            <SEOHead title="Admin | Wular Sports" robots="noindex, nofollow" />
            {/* Start downloading the admin styles straight away, alongside the page's JavaScript */}
            <Head><link rel="preload" as="style" href={ADMIN_CSS} /></Head>
            {ready ? <AdminView /> : <p style={{ padding: '3rem 1rem', textAlign: 'center', color: '#888' }}>Loading admin…</p>}
        </>
    );
}
