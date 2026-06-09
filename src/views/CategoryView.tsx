import React, { FC, useState, useMemo } from 'react';
import { ProductFull } from '../types';
import { ProductCard } from '../components/product/ProductCard';
import { SEOHead } from '../components/common/SEOHead';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { Icon } from '../components/common/Icon';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc';
type ScoopFilter = 'all' | 'scoop' | 'non-scoop';

interface CategoryViewProps {
    title: string;
    h1Title: string;
    description: string;
    bodyText: string;
    keywords: string;
    canonicalUrl: string;
    products: ProductFull[];
    onImageClick: (images: string[], startIndex: number) => void;
    onAddToCart: (product: ProductFull, size: string | null) => void;
    onWatchVideo: (url: string, ref: React.RefObject<HTMLButtonElement>) => void;
}

function getScoopType(product: ProductFull): 'scoop' | 'non-scoop' {
    const scoopSpec = product.specs.find(s => s.toLowerCase().startsWith('scoop profile'));
    if (!scoopSpec) return 'non-scoop';
    const value = scoopSpec.toLowerCase();
    return value.includes('non-scoop') ? 'non-scoop' : 'scoop';
}

export const CategoryView: FC<CategoryViewProps> = ({
    title,
    h1Title,
    description,
    bodyText,
    keywords,
    canonicalUrl,
    products,
    onImageClick,
    onAddToCart,
    onWatchVideo
}) => {
    const [sortBy, setSortBy] = useState<SortOption>('default');
    const [scoopFilter, setScoopFilter] = useState<ScoopFilter>('all');

    const hasBothScoopTypes = useMemo(() => {
        const types = new Set(products.map(getScoopType));
        return types.has('scoop') && types.has('non-scoop');
    }, [products]);

    const displayedProducts = useMemo(() => {
        let list = [...products];
        if (scoopFilter !== 'all') {
            list = list.filter(p => getScoopType(p) === scoopFilter);
        }
        if (sortBy === 'price-asc') return list.sort((a, b) => a.price - b.price);
        if (sortBy === 'price-desc') return list.sort((a, b) => b.price - a.price);
        if (sortBy === 'name-asc') return list.sort((a, b) => a.name.localeCompare(b.name));
        return list;
    }, [products, sortBy, scoopFilter]);

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

            <div className="container" style={{ paddingTop: '2rem' }}>
                <Breadcrumb items={[
                    { name: 'Home', url: '/' },
                    { name: 'Collection', url: '/collection' },
                    { name: h1Title },
                ]} />
            </div>

            <section className="category-hero" style={{ padding: '6rem 2rem 2rem', background: 'var(--black)' }}>
                <div className="container">
                    <h1 className="section-title" style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--golden)' }}>{h1Title}</h1>
                    <div className="footer-title-bar" style={{ margin: '0 auto 2rem', backgroundColor: 'var(--golden)' }}></div>
                    <p className="category-description" style={{ maxWidth: '800px', margin: '0 auto 2.5rem', color: '#bbb', fontSize: '1.05rem', lineHeight: '1.8', textAlign: 'center' }}>{bodyText}</p>
                </div>
            </section>

            <section className="category-products" style={{ paddingTop: '0', background: 'var(--black)' }}>
                <div className="container">
                    {products.length > 1 && (
                        <div className="category-toolbar">
                            <div className="category-toolbar-left">
                                <span className="category-count">{displayedProducts.length} product{displayedProducts.length !== 1 ? 's' : ''}</span>
                                {hasBothScoopTypes && (
                                    <div className="scoop-filter-chips">
                                        {(['all', 'scoop', 'non-scoop'] as ScoopFilter[]).map(opt => (
                                            <button
                                                key={opt}
                                                className={`scoop-chip ${scoopFilter === opt ? 'active' : ''}`}
                                                onClick={() => setScoopFilter(opt)}
                                            >
                                                {opt === 'all' ? 'All' : opt === 'scoop' ? 'Scoop' : 'Non-Scoop'}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="category-sort">
                                <label htmlFor="sort-select">Sort by:</label>
                                <select
                                    id="sort-select"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                                >
                                    <option value="default">Featured</option>
                                    <option value="price-asc">Price: Low to High</option>
                                    <option value="price-desc">Price: High to Low</option>
                                    <option value="name-asc">Name: A–Z</option>
                                </select>
                            </div>
                        </div>
                    )}
                    <div className="collection-grid">
                        {displayedProducts.length > 0 ? (
                            displayedProducts.map(product => (
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
                                <Icon name="fa-search" style={{ fontSize: '3rem', color: '#333', marginBottom: '1rem' }} />
                                <p style={{ color: '#888' }}>No products found for this filter.</p>
                                <button className="btn" style={{ marginTop: '2rem' }} onClick={() => setScoopFilter('all')}>
                                    Clear Filter
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};
