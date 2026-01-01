import { FC, useState } from 'react';
import { FilterOptions } from '../../utils/filtering';

interface FilterPanelProps {
    filters: FilterOptions;
    onFilterChange: (filters: FilterOptions) => void;
    availableCategories: string[];
    priceRange: { min: number; max: number };
}

export const FilterPanel: FC<FilterPanelProps> = ({
    filters,
    onFilterChange,
    availableCategories,
    priceRange
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleCategoryToggle = (category: string) => {
        const newCategories = filters.categories.includes(category)
            ? filters.categories.filter(c => c !== category)
            : [...filters.categories, category];

        onFilterChange({ ...filters, categories: newCategories });
    };

    const handlePriceChange = (min: number, max: number) => {
        onFilterChange({
            ...filters,
            priceRange: { min, max }
        });
    };

    const handleClearFilters = () => {
        onFilterChange({
            categories: [],
            priceRange: priceRange,
            inStockOnly: false
        });
    };

    const activeFilterCount = filters.categories.length +
        (filters.inStockOnly ? 1 : 0) +
        (filters.priceRange.min !== priceRange.min || filters.priceRange.max !== priceRange.max ? 1 : 0);

    return (
        <>
            {/* Mobile Filter Button */}
            <button
                className="filter-toggle-btn"
                onClick={() => setIsOpen(!isOpen)}
            >
                <i className="fas fa-filter"></i>
                <span>Filters</span>
                {activeFilterCount > 0 && (
                    <span className="filter-badge">{activeFilterCount}</span>
                )}
            </button>

            {/* Filter Panel */}
            <div className={`filter-panel ${isOpen ? 'open' : ''}`}>
                <div className="filter-header">
                    <h3>Filters</h3>
                    <button
                        className="filter-close-btn"
                        onClick={() => setIsOpen(false)}
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="filter-content">
                    {/* Categories Filter */}
                    <div className="filter-section">
                        <h4 className="filter-section-title">
                            <i className="fas fa-tag"></i>
                            Category
                        </h4>
                        <div className="filter-options">
                            {availableCategories.map(category => (
                                <label key={category} className="filter-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={filters.categories.includes(category)}
                                        onChange={() => handleCategoryToggle(category)}
                                    />
                                    <span>{category}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Price Range Filter */}
                    <div className="filter-section">
                        <h4 className="filter-section-title">
                            <i className="fas fa-rupee-sign"></i>
                            Price Range
                        </h4>
                        <div className="price-range-inputs">
                            <div className="price-input-group">
                                <label>Min</label>
                                <input
                                    type="number"
                                    className="price-input"
                                    value={filters.priceRange.min}
                                    onChange={(e) => handlePriceChange(
                                        parseInt(e.target.value) || priceRange.min,
                                        filters.priceRange.max
                                    )}
                                    min={priceRange.min}
                                    max={filters.priceRange.max}
                                />
                            </div>
                            <span className="price-separator">-</span>
                            <div className="price-input-group">
                                <label>Max</label>
                                <input
                                    type="number"
                                    className="price-input"
                                    value={filters.priceRange.max}
                                    onChange={(e) => handlePriceChange(
                                        filters.priceRange.min,
                                        parseInt(e.target.value) || priceRange.max
                                    )}
                                    min={filters.priceRange.min}
                                    max={priceRange.max}
                                />
                            </div>
                        </div>
                        <div className="price-range-slider">
                            <input
                                type="range"
                                className="range-slider"
                                min={priceRange.min}
                                max={priceRange.max}
                                value={filters.priceRange.min}
                                onChange={(e) => handlePriceChange(
                                    parseInt(e.target.value),
                                    filters.priceRange.max
                                )}
                            />
                            <input
                                type="range"
                                className="range-slider"
                                min={priceRange.min}
                                max={priceRange.max}
                                value={filters.priceRange.max}
                                onChange={(e) => handlePriceChange(
                                    filters.priceRange.min,
                                    parseInt(e.target.value)
                                )}
                            />
                        </div>
                    </div>

                    {/* Stock Filter */}
                    <div className="filter-section">
                        <label className="filter-checkbox">
                            <input
                                type="checkbox"
                                checked={filters.inStockOnly}
                                onChange={(e) => onFilterChange({
                                    ...filters,
                                    inStockOnly: e.target.checked
                                })}
                            />
                            <span>In Stock Only</span>
                        </label>
                    </div>

                    {/* Clear Filters */}
                    {activeFilterCount > 0 && (
                        <button
                            className="btn-clear-filters"
                            onClick={handleClearFilters}
                        >
                            <i className="fas fa-times-circle"></i>
                            Clear All Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="filter-backdrop"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
};
