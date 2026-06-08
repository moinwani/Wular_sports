import dynamic from 'next/dynamic';

const AdminView = dynamic(() => import('../src/views/AdminView').then(m => ({ default: m.AdminView })), { ssr: false });

export default function AdminPage() { return <AdminView />; }
