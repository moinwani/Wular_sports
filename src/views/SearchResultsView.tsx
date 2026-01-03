import { FC, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { products } from '../data/products';
import { ProductCard } from '../components/product/ProductCard';
import { SEOHead } from '../components/common/SEOHead';
import { searchProducts } from '../utils/search';
import { ProductFull } from '../types';

interface SearchResultsViewProps {
    onAddToCart: (product: ProductFull, size: string | null) => void;
    onImageClick: (images: string[], startIndex: number) => void;
    onWatchVideo: (url: string, ref: React.RefObject<HTMLButtonElement>) => void;
}

export const SearchResultsView: FC<SearchResultsViewProps> = ({
    onAddToCart,
    onImageClick,
    onWatchVideo
}) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const query = searchParams.get('q') || '';
    const [results, setResults] = useState<ProductFull[]>([]);

    useEffect(() => {
        if (query) {
            const searchResults = searchProducts(products, query);
            setResults(searchResults);
        } else {
            setResults([]);
        }
    }, [query]);



    return (
        <div className="view search-results-view">
            <SEOHead
                title={`Search Results for "${query}" | Wular Sports`}
                description={`Search results for ${query}. Find premium cricket bats and sports equipment at Wular Sports.`}
                keywords={`${query}, cricket bats, search, Wular Sports`}
                canonicalUrl={`https://wularsports.com/search?q=${encodeURIComponent(query)}`}
            />

            <section className="search-results-section">
                <div className="container">
                    {/* Search Bar */}


                    {/* Results Header */}
                    {query && (
                        <div className="search-results-info">
                            <h1 className="search-results-title">
                                Search Results for "{query}"
                            </h1>
                            <p className="search-results-count">
                                {results.length} {results.length === 1 ? 'product' : 'products'} found
                            </p>
                        </div>
                    )}

                    {/* Results Grid */}
                    {results.length > 0 ? (
                        <div className="collection-grid">
                            {results.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onAddToCart={onAddToCart}
                                    onImageClick={onImageClick}
                                    onWatchVideo={onWatchVideo}
                                />
                            ))}
                        </div>
                    ) : query ? (
                        // No Results State
                        <div className="search-no-results">
                            <div className="no-results-icon">
                                <i className="fas fa-search"></i>
                            </div>
                            <h2 className="no-results-title">No products found</h2>
                            <p className="no-results-message">
                                We couldn't find any products matching "{query}".
                            </p>
                            <div className="no-results-suggestions">
                                <h3>Suggestions:</h3>
                                <ul>
                                    <li>Check your spelling</li>
                                    <li>Try more general keywords</li>
                                    <li>Try different keywords</li>
                                </ul>
                            </div>
                            <button
                                className="btn"
                                onClick={() => navigate('/collection')}
                            >
                                Browse All Products
                            </button>
                        </div>
                    ) : (
                        // Empty State (no query)
                        <div className="search-empty-state">
                            <div className="empty-state-icon">
                                <i className="fas fa-search"></i>
                            </div>
                            <h2 className="empty-state-title">Start Searching</h2>
                            <p className="empty-state-message">
                                Enter a search term to find cricket bats and equipment
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};
