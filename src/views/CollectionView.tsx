import React, { FC } from 'react';
import { ProductFull } from '../types';
import { ProductCard } from '../components/product/ProductCard';

interface CollectionViewProps {
    products: ProductFull[];
    onImageClick: (images: string[], startIndex: number) => void;
    onAddToCart: (product: ProductFull, size: string | null) => void;
    onWatchVideo: (url: string, ref: React.RefObject<HTMLButtonElement>) => void;
}

export const CollectionView: FC<CollectionViewProps> = ({ products, onImageClick, onAddToCart, onWatchVideo }) => {
    const categories = {
        "Hard Tennis Bats": products.filter(p => p.category.includes("Hard Tennis")),
        "Soft Tennis Bats": products.filter(p => p.category.includes("Soft Tennis")),
        "Leather Bat Collection": products.filter(p => p.category.includes("Leather Ball")),
    };

    return (
        <div className="view collection-view">
            <section>
                <div className="container">
                    <h2 className="section-title">Our Collection</h2>
                    <div className="collection-categories">
                        {Object.entries(categories).map(([title, productsInCategory]) => (
                            productsInCategory.length > 0 && (
                                <div key={title} className="collection-category">
                                    <h3 className="collection-category-title">{title}</h3>
                                    <div className="collection-grid">
                                        {productsInCategory.map(product => (
                                            <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} onImageClick={onImageClick} onWatchVideo={onWatchVideo} />
                                        ))}
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};
