import React, { FC } from 'react';
import { SEOHead } from '../components/common/SEOHead';
import { ProductFull } from '../types';

type View = 'hard-tennis' | 'soft-tennis' | 'leather-bats';

interface CollectionViewProps {
    onNavigate: (view: View) => void;
    onImageClick: (images: string[], startIndex: number) => void;
    onAddToCart: (product: ProductFull, size: string | null) => void;
    onWatchVideo: (url: string, ref: React.RefObject<HTMLButtonElement>) => void;
}

export const CollectionView: FC<CollectionViewProps> = ({ onNavigate }) => {

    const hubCategories = [
        {
            id: 'hard-tennis',
            title: 'Hard Tennis Bats',
            view: 'hard-tennis' as const,
            image: 'https://res.cloudinary.com/ddahm5ebv/image/upload/v1752150442/photo_6305588890991445271_m_tme4bb.jpg',
            description: 'Explosive power for hard tennis ball cricket.'
        },
        {
            id: 'soft-tennis',
            title: 'Soft Tennis Bats',
            view: 'soft-tennis' as const,
            image: 'https://res.cloudinary.com/ddahm5ebv/image/upload/v1752150316/photo_6305588890991445275_m_h8qfpt.jpg',
            description: 'Lightweight precision for soft tennis ball games.'
        },
        {
            id: 'leather-bats',
            title: 'Leather Cricket Bats',
            view: 'leather-bats' as const,
            image: 'https://res.cloudinary.com/ddahm5ebv/image/upload/v1752150442/photo_6305588890991445272_m_vms9pt.jpg',
            description: 'Professional grade Kashmir Willow for leather balls.'
        }
    ];

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Cricket Bats Collection Hub",
        "description": "Select a category to browse our handcrafted cricket bats",
        "url": "https://wularsports.com/collection"
    };

    return (
        <div className="view collection-view">
            <SEOHead
                title="Our Collection | Wular Sports"
                description="Browse our range of handcrafted Hard Tennis, Soft Tennis, and Leather ball cricket bats."
                ogType="website"
                canonicalUrl="https://wularsports.com/collection"
                structuredData={structuredData}
            />

            <section className="collection-hub">
                <div className="container">
                    <h1 className="section-title">Shop by Category</h1>
                    <p style={{ marginBottom: '3rem', color: '#ccc' }}>Professional equipment for every type of game</p>

                    <div className="hub-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '2rem',
                        marginTop: '2rem'
                    }}>
                        {hubCategories.map(cat => (
                            <div
                                key={cat.id}
                                className="hub-card"
                                onClick={() => onNavigate(cat.view)}
                                style={{
                                    cursor: 'pointer',
                                    position: 'relative',
                                    borderRadius: '15px',
                                    border: '2px solid var(--golden)',
                                    overflow: 'hidden',
                                    aspectRatio: '4/5',
                                    transition: 'transform 0.3s ease'
                                }}
                            >
                                <img
                                    src={cat.image}
                                    alt={cat.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <div className="hub-card-overlay" style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
                                    padding: '2rem 1.5rem',
                                    textAlign: 'left'
                                }}>
                                    <h3 style={{ color: 'var(--golden)', marginBottom: '0.5rem' }}>{cat.title}</h3>
                                    <p style={{ color: '#fff', fontSize: '0.9rem' }}>{cat.description}</p>
                                    <button className="btn" style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}>Browse</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};
