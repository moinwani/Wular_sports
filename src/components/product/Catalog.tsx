import React, { memo } from 'react';
import { ProductFull } from '../../types';
import { ProductCard } from './ProductCard';
import { products } from '../../data/products';

export interface CatalogProps {
    onAddToCart: (product: ProductFull, size: string | null) => void;
    onImageClick: (images: string[], startIndex: number) => void;
    onWatchVideo: (url: string, ref: React.RefObject<HTMLButtonElement>) => void;
}

export const Catalog = memo(React.forwardRef<HTMLElement, CatalogProps>(({ onAddToCart, onImageClick, onWatchVideo }, ref) => (
    <section id="catalog" ref={ref}>
        <div className="container">
            <h2 className="section-title">Featured Bats</h2>
            <div className="catalog-grid">
                {products.map(product => (
                    <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} onImageClick={onImageClick} onWatchVideo={onWatchVideo} />
                ))}
            </div>
        </div>
    </section>
)));
Catalog.displayName = "Catalog";
