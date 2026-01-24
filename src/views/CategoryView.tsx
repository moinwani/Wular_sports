import React, { FC } from 'react';
import { ProductFull } from '../types';
import { ProductCard } from '../components/product/ProductCard';
import { SEOHead } from '../components/common/SEOHead';

interface CategoryViewProps {
    title: string;
    h1Title: string;
    description: string;
    keywords: string;
    canonicalUrl: string;
    products: ProductFull[];
    onImageClick: (images: string[], startIndex: number) => void;
    onAddToCart: (product: ProductFull, size: string | null) => void;
    onWatchVideo: (url: string, ref: React.RefObject<HTMLButtonElement>) => void;
}

export const CategoryView: FC<CategoryViewProps> = ({
    title,
    h1Title,
    description,
    keywords,
    canonicalUrl,
    products,
    onImageClick,
    onAddToCart,
    onWatchVideo
}) => {

    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                "name": title,
                "description": description,
                "url": canonicalUrl,
                "numberOfItems": products.length,
                "mainEntity": {
                    "@type": "ItemList",
                    "itemListElement": products.map((product, index) => ({
                        "@type": "ListItem",
                        "position": index + 1,
                        "url": `https://wularsports.com/product/${product.id}`
                    }))
                }
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Home",
                        "item": "https://wularsports.com"
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": "Collection",
                        "item": "https://wularsports.com/collection"
                    },
                    {
                        "@type": "ListItem",
                        "position": 3,
                        "name": h1Title,
                        "item": canonicalUrl
                    }
                ]
            }
        ]
    };

    return (
        <div className="view category-view">
            <SEOHead
                title={`${title} | Wular Sports`}
                description={description}
                keywords={keywords}
                ogType="website"
                canonicalUrl={canonicalUrl}
                structuredData={structuredData}
            />

            <section className="category-hero" style={{ padding: '6rem 2rem 2rem', background: 'var(--black)' }}>
                <div className="container">
                    <h1 className="section-title" style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--golden)' }}>{h1Title}</h1>
                    <div className="footer-title-bar" style={{ margin: '0 auto 2rem', backgroundColor: 'var(--golden)' }}></div>
                </div>
            </section>

            <section className="category-products" style={{ paddingTop: '0', background: 'var(--black)' }}>
                <div className="container">
                    <div className="collection-grid">
                        {products.length > 0 ? (
                            products.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onAddToCart={onAddToCart}
                                    onImageClick={onImageClick}
                                    onWatchVideo={onWatchVideo}
                                />
                            ))
                        ) : (
                            <div className="no-products-found" style={{ textAlign: 'center', padding: '4rem' }}>
                                <i className="fas fa-search" style={{ fontSize: '3rem', color: '#333', marginBottom: '1rem' }}></i>
                                <p style={{ color: '#888' }}>No products found in this category.</p>
                                <a href="/collection" className="btn" style={{ marginTop: '2rem' }}>Back to Collection</a>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};
