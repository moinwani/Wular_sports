import React, { FC, useState, useMemo } from 'react';
import { ProductFull } from '../types';
import { ProductCard } from '../components/product/ProductCard';
import { SEOHead } from '../components/common/SEOHead';
import { FilterPanel } from '../components/product/FilterPanel';
import { SortDropdown } from '../components/product/SortDropdown';
import {
    filterProducts,
    sortProducts,
    getAllCategories,
    getPriceRange,
    FilterOptions,
    SortOption
} from '../utils/filtering';

interface CollectionViewProps {
    products: ProductFull[];
    onImageClick: (images: string[], startIndex: number) => void;
    onAddToCart: (product: ProductFull, size: string | null) => void;
    onWatchVideo: (url: string, ref: React.RefObject<HTMLButtonElement>) => void;
}

export const CollectionView: FC<CollectionViewProps> = ({ products, onImageClick, onAddToCart, onWatchVideo }) => {
    const availableCategories = useMemo(() => getAllCategories(products), [products]);
    const priceRange = useMemo(() => getPriceRange(products), [products]);

    const [filters, setFilters] = useState<FilterOptions>({
        categories: [],
        priceRange: priceRange,
        inStockOnly: false
    });

    const [sortOption, setSortOption] = useState<SortOption>('default');

    // Apply filters and sorting
    const filteredAndSortedProducts = useMemo(() => {
        const filtered = filterProducts(products, filters);
        return sortProducts(filtered, sortOption);
    }, [products, filters, sortOption]);

    const categories = {
        "Hard Tennis Bats": filteredAndSortedProducts.filter(p => p.category.includes("Hard Tennis")),
        "Soft Tennis Bats": filteredAndSortedProducts.filter(p => p.category.includes("Soft Tennis")),
        "Leather Bat Collection": filteredAndSortedProducts.filter(p => p.category.includes("Leather Ball")),
    };

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Cricket Bats Collection",
        "description": "Browse our complete collection of handcrafted cricket bats",
        "numberOfItems": filteredAndSortedProducts.length
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

                    {/* Filter and Sort Controls */}
                    <div className="collection-controls">
                        <FilterPanel
                            filters={filters}
                            onFilterChange={setFilters}
                            availableCategories={availableCategories}
                            priceRange={priceRange}
                        />
                        <div className="collection-controls-right">
                            <div className="collection-results-count">
                                {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? 'product' : 'products'}
                            </div>
                            <SortDropdown
                                value={sortOption}
                                onChange={setSortOption}
                            />
                        </div>
                    </div>

                    {/* Products Grid */}
                    {filteredAndSortedProducts.length > 0 ? (
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
                    ) : (
                        <div className="no-products-found">
                            <i className="fas fa-search"></i>
                            <h3>No products found</h3>
                            <p>Try adjusting your filters to see more results</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};
