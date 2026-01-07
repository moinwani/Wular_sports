import React, { FC } from 'react';
import { ProductFull } from '../types';
import { ProductCard } from '../components/product/ProductCard';
import { SEOHead } from '../components/common/SEOHead';

interface CollectionViewProps {
    products: ProductFull[];
    onImageClick: (images: string[], startIndex: number) => void;
    onAddToCart: (product: ProductFull, size: string | null) => void;
    onWatchVideo: (url: string, ref: React.RefObject<HTMLButtonElement>) => void;
}

export const CollectionView: FC<CollectionViewProps> = ({ products, onImageClick, onAddToCart, onWatchVideo }) => {

    // Simple categorization without filtering logic
    const categories = {
        "Hard Tennis Bats": products.filter(p => p.category.includes("Hard Tennis")),
        "Soft Tennis Bats": products.filter(p => p.category.includes("Soft Tennis")),
        "Leather Bat Collection": products.filter(p => p.category.includes("Leather Ball")),
    };

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Cricket Bats Collection",
        "description": "Browse our complete collection of handcrafted cricket bats",
        "numberOfItems": products.length
    };

    return (
        <div className="view collection-view">
            <SEOHead
                title="Shop Cricket Bats Collection | Wular Sports - Hard Tennis, Soft Tennis & Leather Ball Bats"
                description="Browse our complete collection of premium handcrafted cricket bats. Hard tennis bats, soft tennis bats, and leather ball bats. All bats ready to play with 1-year warranty."
                keywords="buy cricket bats, cricket bat collection, hard tennis bats, soft tennis bats, leather ball bats, Kashmir willow, cricket equipment online"
                ogType="website"
                canonicalUrl="https://wularsports.com/collection"
                structuredData={structuredData}
            />
            <section>
                <div className="container">
                    <h2 className="section-title">Our Collection</h2>

                    {products.length > 0 ? (
                        <div className="collection-categories">
                            {Object.entries(categories).map(([title, productsInCategory]) => {
                                // Create simple IDs for linking
                                const categoryId = title.toLowerCase().includes('hard') ? 'hard-tennis' :
                                    title.toLowerCase().includes('soft') ? 'soft-tennis' :
                                        title.toLowerCase().includes('leather') ? 'leather-bat' : title;

                                return productsInCategory.length > 0 && (
                                    <div key={title} className="collection-category" id={categoryId}>
                                        <h3 className="collection-category-title">{title}</h3>
                                        <div className="collection-grid">
                                            {productsInCategory.map(product => (
                                                <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} onImageClick={onImageClick} onWatchVideo={onWatchVideo} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="no-products-found" style={{ textAlign: 'center', padding: '4rem' }}>
                            <p>No products available at the moment.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};
