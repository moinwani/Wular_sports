import Link from 'next/link';
import { SEOHead } from '../src/components/common/SEOHead';

export default function Custom404() {
    return (
        <div className="page-404">
            <SEOHead title="Page Not Found | Wular Sports" />
            <div className="container" style={{ textAlign: 'center', padding: '6rem 2rem' }}>
                <h1 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '5rem', color: 'var(--golden)', marginBottom: '0.5rem' }}>404</h1>
                <p style={{ fontSize: '1.2rem', color: '#888', marginBottom: '2rem' }}>The page you're looking for doesn't exist.</p>
                <Link href="/" className="btn">Back to Home</Link>
            </div>
        </div>
    );
}
