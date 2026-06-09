import dynamic from 'next/dynamic';
import { SEOHead } from '../src/components/common/SEOHead';

const AdminView = dynamic(() => import('../src/views/AdminView').then(m => ({ default: m.AdminView })), { ssr: false });

export default function AdminPage() {
    return (
        <>
            <SEOHead title="Admin | Wular Sports" robots="noindex, nofollow" />
            <AdminView />
        </>
    );
}
