import { FC } from 'react';
import Link from 'next/link';
import { SEOHead } from '../components/common/SEOHead';
import { Icon } from '../components/common/Icon';

const faqs = [
    {
        question: 'Which Wular Sports hard tennis bat is best for power hitting?',
        answer: 'For raw, boundary-clearing power the Bahubali Edition is the go-to — its flat (non-scoop) profile keeps more wood in the blade and its 46–52 mm edges create a large sweet spot. For explosive stroke play with easier pickup, the Legacy Edition 2.0 (ramp scoop, hard-pressed, 3-year seasoned willow) is the best all-round choice.',
    },
    {
        question: 'What is the difference between a ramp scoop and a non-scoop bat?',
        answer: 'A ramp scoop removes a shallow channel of wood from the back of the blade to redistribute weight, improving pickup and balance (Legacy Edition 2.0). A non-scoop (flat) bat keeps that wood in place, adding raw hitting mass behind the ball (Bahubali Edition). The Legacy Edition 1.0 has a scoop with drilled shoulders for a lighter pickup.',
    },
    {
        question: 'Is the Legacy Edition 2.0 worth the extra cost over the Legacy 1.0?',
        answer: 'For most tournament players, yes. The Legacy 2.0 upgrades to premium willow seasoned for 3 full years, a ramp scoop profile, a premium Singapore cane handle, and hard-pressed processing — all of which improve durability, balance, and power for ₹700 more.',
    },
    {
        question: 'How do I compare a Wular Sports bat with bats from other makers?',
        answer: 'Compare the same things for every bat: how long the willow was seasoned, how the blade was pressed, the exact weight, the edge thickness, the scoop, the handle and what the warranty covers. Every Wular Sports bat is hard-pressed, naturally seasoned, fitted with a Singapore cane handle and shipped knocked-in and oiled, with free delivery and 3-day returns on defective bats.',
    },
    {
        question: 'Do these bats come ready to play out of the box?',
        answer: 'Yes. Every Wular Sports hard tennis bat ships fully knocked-in and oiled, with a premium toe guard, bat bag, and extra grip — match-ready the moment it arrives.',
    },
];

const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse' as const,
    margin: '20px 0',
};

const thStyle = {
    padding: '12px',
    textAlign: 'left' as const,
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.08)',
    fontWeight: 600,
};

const tdStyle = {
    padding: '12px',
    border: '1px solid rgba(255,255,255,0.2)',
};

const rows: { label: string; l1: string; l2: string; bh: string }[] = [
    { label: 'Willow grade', l1: 'Grade A Kashmiri willow', l2: 'Premium Kashmiri willow', bh: 'Kashmiri willow' },
    { label: 'Natural seasoning', l1: 'Seasoned (1–3 yr range)', l2: '3 years', bh: '~1 year' },
    { label: 'Weight', l1: '950–1,050 g', l2: '980–1,100 g', bh: '950–1,100 g' },
    { label: 'Edges', l1: '48–52 mm', l2: '48–52 mm', bh: '46–52 mm' },
    { label: 'Face width', l1: '4.4 inches', l2: '4.5 inches', bh: '4.4 inches' },
    { label: 'Scoop profile', l1: 'Scoop with drilled shoulders', l2: 'Ramp scoop (minimal)', bh: 'Flat (non-scoop)' },
    { label: 'Handle', l1: 'Singapore cane', l2: 'Premium Singapore cane', bh: 'Singapore cane' },
    { label: 'Processing', l1: 'Hard pressed', l2: 'Hard pressed', bh: 'Hard pressed' },
    { label: 'Sizes', l1: '35 / 36 inch', l2: '35 / 36 inch', bh: '35 / 36 inch' },
    { label: 'Price', l1: '₹2,799', l2: '₹3,499', bh: '₹2,999' },
    { label: 'Warranty', l1: '6-month handle warranty', l2: '6-month handle warranty', bh: '6-month handle warranty' },
    { label: 'Best for', l1: 'Value-focused club players', l2: 'Tournament all-rounders', bh: 'Aggressive power hitters' },
];

export const ComparisonView: FC = () => {
    const structuredData = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebPage',
                name: 'Hard Tennis Bat Comparison: Legacy 1.0 vs Legacy 2.0 vs Bahubali',
                url: 'https://wularsports.com/comparison',
                description: 'Compare the Wular Sports Legacy Edition 2.0, Legacy Edition 1.0 and Bahubali Edition hard tennis bats side by side, and learn what to check when comparing any hard tennis bat.',
            },
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://wularsports.com' },
                    { '@type': 'ListItem', position: 2, name: 'Hard Tennis Bat Comparison', item: 'https://wularsports.com/comparison' },
                ],
            },
            {
                '@type': 'FAQPage',
                mainEntity: faqs.map(f => ({
                    '@type': 'Question',
                    name: f.question,
                    acceptedAnswer: { '@type': 'Answer', text: f.answer },
                })),
            },
            {
                '@type': 'ItemList',
                name: 'Wular Sports Hard Tennis Bat Range',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Legacy Edition 2.0', url: 'https://wularsports.com/product/legacy-edition-2.0' },
                    { '@type': 'ListItem', position: 2, name: 'Legacy Edition 1.0', url: 'https://wularsports.com/product/legacy-edition' },
                    { '@type': 'ListItem', position: 3, name: 'Bahubali Edition', url: 'https://wularsports.com/product/bahubali-edition' },
                ],
            },
        ],
    };

    return (
        <div className="view comparison-page">
            <SEOHead
                title="Hard Tennis Bat Comparison: Legacy 1.0 vs 2.0 vs Bahubali | Wular Sports"
                description="Compare the Wular Sports Legacy 2.0, Legacy 1.0 and Bahubali hard tennis bats side by side on willow, weight, edges, scoop and price, and see which suits your game."
                keywords="hard tennis bat comparison, best hard tennis bat India, Kashmiri willow bat comparison, scoop vs flat hard tennis bat"
                canonicalUrl="https://wularsports.com/comparison"
                structuredData={structuredData}
            />

            <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
                <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', marginBottom: '0.5rem' }}>
                    Hard Tennis Bat Comparison: Legacy 1.0 vs Legacy 2.0 vs Bahubali
                </h1>
                <p style={{ fontSize: '1.05rem', opacity: 0.85, marginBottom: '2rem' }}>
                    Deciding between our hard tennis bats? Below is a spec-by-spec comparison of the Legacy
                    Edition 1.0, Legacy Edition 2.0 and Bahubali Edition, followed by what to check when you
                    compare any hard tennis bat. Looking for our top-grade bat? See the{' '}
                    <Link href="/product/knight-edition-kashmiri-willow-hard-tennis-bat">Knight Edition</Link>.
                </p>

                <h2>Wular Sports Hard Tennis Bat Range Compared</h2>
                <div style={{ overflowX: 'auto' }}>
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Spec</th>
                                <th style={thStyle}>Legacy Edition 1.0</th>
                                <th style={thStyle}>Legacy Edition 2.0</th>
                                <th style={thStyle}>Bahubali Edition</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map(row => (
                                <tr key={row.label}>
                                    <td style={{ ...tdStyle, fontWeight: 600 }}>{row.label}</td>
                                    <td style={tdStyle}>{row.l1}</td>
                                    <td style={tdStyle}>{row.l2}</td>
                                    <td style={tdStyle}>{row.bh}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', margin: '1.5rem 0' }}>
                    <Link href="/product/legacy-edition-2.0" className="btn-primary" style={{ padding: '0.75rem 1.25rem', borderRadius: 8, textDecoration: 'none' }}>
                        <Icon name="fa-shopping-bag" /> Shop Legacy 2.0 — ₹3,499
                    </Link>
                    <Link href="/product/legacy-edition" className="btn-primary" style={{ padding: '0.75rem 1.25rem', borderRadius: 8, textDecoration: 'none' }}>
                        <Icon name="fa-shopping-bag" /> Shop Legacy 1.0 — ₹2,799
                    </Link>
                    <Link href="/product/bahubali-edition" className="btn-primary" style={{ padding: '0.75rem 1.25rem', borderRadius: 8, textDecoration: 'none' }}>
                        <Icon name="fa-shopping-bag" /> Shop Bahubali — ₹2,999
                    </Link>
                </div>

                <h2>What to Check When You Compare Any Hard Tennis Bat</h2>
                <p>
                    Photos and stickers make most bats look alike. Ask every seller for the same details: seasoning,
                    pressing, exact weight, edge size, scoop and handle, and what the warranty actually covers. Our
                    guide to the <Link href="/blog/best-hard-tennis-bat">best hard tennis bat for 2027</Link> walks
                    through each one. Here is how we build ours:
                </p>
                <ul style={{ lineHeight: 1.9, marginBottom: '1.5rem' }}>
                    <li><strong>Hard-pressed blades</strong> — compressed for density, durability, and power on the hard tennis ball.</li>
                    <li><strong>1–3 years natural seasoning</strong> — air-dried in the Srinagar workshop, never rushed.</li>
                    <li><strong>Singapore cane handles</strong> — superior shock absorption on mishits.</li>
                    <li><strong>Scooped and flat options</strong> — so you can choose a quicker pickup or raw power.</li>
                    <li><strong>Ready to play out of the box</strong> — every bat ships fully knocked and oiled with a toe guard, bat bag, and extra grip.</li>
                    <li><strong>6-month handle warranty, free India-wide delivery, 3-day returns on defective bats, and COD</strong> — so buying online carries little risk.</li>
                </ul>

                <h2>Which One Should You Choose?</h2>
                <p>
                    Choose the <Link href="/product/legacy-edition-2.0">Legacy Edition 2.0</Link> if you want the best
                    all-round tournament bat with 3-year seasoned willow and a ramp scoop. Choose the{' '}
                    <Link href="/product/legacy-edition">Legacy Edition 1.0</Link> if you want a scooped bat with a light
                    pickup at the lowest price. Choose the <Link href="/product/bahubali-edition">Bahubali Edition</Link> if you are an
                    aggressive hitter who wants maximum sweet spot and raw power.
                </p>
                <p>
                    Browse our full <Link href="/hard-tennis-bats">hard tennis bat collection</Link> or read our{' '}
                    <Link href="/blog">buying guides</Link> to go deeper on weight, scoop, and ball choice.
                </p>

                <h2 style={{ marginTop: '3rem' }}>Frequently Asked Questions</h2>
                {faqs.map(f => (
                    <div key={f.question} style={{ marginBottom: '1.25rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>{f.question}</h3>
                        <p style={{ opacity: 0.85 }}>{f.answer}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
