import { memo, forwardRef, RefObject } from 'react';
import { ProductFull } from '../../types';
import { ProductCard } from './ProductCard';
import { products } from '../../data/products';

export interface CatalogProps {
    onAddToCart: (product: ProductFull, size: string | null) => void;
    onImageClick: (images: string[], startIndex: number) => void;
    onWatchVideo: (url: string, ref: RefObject<HTMLButtonElement>) => void;
}

export const Catalog = memo(forwardRef<HTMLElement, CatalogProps>(({ onAddToCart, onImageClick, onWatchVideo }, ref) => {
    const categories = {
        "Hard Tennis Bats": products.filter(p => p.category.includes("Hard Tennis")),
        "Soft Tennis Bats": products.filter(p => p.category.includes("Soft Tennis")),
        "Leather Bat Collection": products.filter(p => p.category.includes("Leather Ball")),
    };

    return (
        <section id="catalog" ref={ref}>
            <div className="container">
                <h2 className="section-title">Our Collection</h2>

                <div className="catalog-categories">
                    {Object.entries(categories).map(([title, productsInCategory]) => (
                        productsInCategory.length > 0 && (
                            <div key={title} className="catalog-category-group" style={{ marginBottom: '4rem' }}>
                                <h3 className="category-subtitle" style={{
                                    fontSize: '1.5rem',
                                    color: 'var(--golden)',
                                    marginBottom: '1.5rem',
                                    fontFamily: "'Oswald', sans-serif",
                                    textTransform: 'uppercase',
                                    borderLeft: '4px solid var(--golden)',
                                    paddingLeft: '1rem'
                                }}>{title}</h3>
                                <div className="catalog-grid">
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
    );
}));
Catalog.displayName = "Catalog";
