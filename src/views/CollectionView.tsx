import React, { FC, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { SEOHead } from '../components/common/SEOHead';
import { useCatalog } from '../context/CatalogContext';
import { productImages, productsIn } from '../lib/catalog';

/** Short taglines for the original categories; new ones use their description */
const TAGLINES: Record<string, string> = {
    'hard-tennis': 'Explosive power for hard tennis ball cricket.',
    'soft-tennis': 'Lightweight precision for soft tennis ball games.',
    'leather-ball': 'Professional grade Kashmir Willow for leather balls.',
};

export const CollectionView: FC = () => {
    const router = useRouter();
    const { products, categories } = useCatalog();
    const [activeIndexes, setActiveIndexes] = useState<{ [key: string]: number }>({});

    const hubCategories = categories.map(c => {
        const inCat = productsIn(products, c);
        return {
            id: c.id,
            title: c.title,
            path: c.path,
            // Leather has few bats, so show more of each one's photos
            images: inCat.flatMap(p => productImages(p).slice(0, inCat.length < 3 ? 3 : 1)),
            description: TAGLINES[c.id] || c.description,
        };
    }).filter(c => c.images.length > 0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndexes(prev => {
                const next = { ...prev };
                hubCategories.forEach(cat => {
                    if (cat.images.length > 1) next[cat.id] = ((prev[cat.id] || 0) + 1) % cat.images.length;
                });
                return next;
            });
        }, 3000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categories, products]);

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
                title="Cricket Bats Collection | Wular Sports — Kashmiri Willow Bats"
                description="Shop handcrafted Kashmiri willow cricket bats by Wular Sports. Choose from Hard Tennis, Soft Tennis, and Leather Ball categories. Free delivery across India."
                keywords="kashmiri willow cricket bats, hard tennis bat, soft tennis bat, leather cricket bat, buy cricket bat online India"
                ogType="website"
                canonicalUrl="https://wularsports.com/collection"
                structuredData={structuredData}
            />
            <section className="collection-hub">
                <div className="container">
                    <h1 className="section-title">Shop by Category</h1>
                    <p style={{ marginBottom: '3rem', color: '#ccc' }}>Professional equipment for every type of game</p>
                    <div className="hub-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
                        {hubCategories.map(cat => (
                            <div key={cat.id} className="hub-card" onClick={() => router.push(cat.path)}
                                style={{ cursor: 'pointer', position: 'relative', borderRadius: '15px', border: '2px solid var(--golden)', overflow: 'hidden', aspectRatio: '4/5', transition: 'transform 0.3s ease' }}>
                                <div className="hub-card-slider" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                                    {cat.images.map((img, idx) => (
                                        <div key={idx} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: (activeIndexes[cat.id] || 0) === idx ? 1 : 0, transition: 'opacity 1s ease-in-out', zIndex: 1 }} />
                                    ))}
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', zIndex: 2 }} />
                                </div>
                                <div className="hub-card-overlay" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2rem 1.5rem', textAlign: 'left', zIndex: 3 }}>
                                    <h3 style={{ color: 'var(--golden)', marginBottom: '0.5rem' }}>{cat.title}</h3>
                                    <p style={{ color: '#fff', fontSize: '0.9rem' }}>{cat.description}</p>
                                    <button className="btn" style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}>Browse</button>
                                    <div style={{ display: 'flex', gap: '5px', marginTop: '1rem' }}>
                                        {cat.images.map((_, idx) => (
                                            <div key={idx} style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: (activeIndexes[cat.id] || 0) === idx ? 'var(--golden)' : 'rgba(255,255,255,0.3)', transition: 'all 0.3s ease' }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};
