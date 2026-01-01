import { ProductFull } from '../types';

export type SortOption = 'default' | 'price-low' | 'price-high' | 'name-az' | 'name-za';

export interface FilterOptions {
    categories: string[];
    priceRange: {
        min: number;
        max: number;
    };
    inStockOnly: boolean;
}

/**
 * Filter products based on filter options
 */
export const filterProducts = (
    products: ProductFull[],
    filters: FilterOptions
): ProductFull[] => {
    return products.filter(product => {
        // Filter by category
        if (filters.categories.length > 0) {
            const hasMatchingCategory = product.category.some(cat =>
                filters.categories.includes(cat)
            );
            if (!hasMatchingCategory) return false;
        }

        // Filter by price range
        if (product.price < filters.priceRange.min || product.price > filters.priceRange.max) {
            return false;
        }

        // Filter by stock (assuming all products are in stock for now)
        // In the future, add an `inStock` property to ProductFull type
        if (filters.inStockOnly) {
            // For now, all products are considered in stock
            return true;
        }

        return true;
    });
};

/**
 * Sort products based on sort option
 */
export const sortProducts = (
    products: ProductFull[],
    sortOption: SortOption
): ProductFull[] => {
    const sorted = [...products];

    switch (sortOption) {
        case 'price-low':
            return sorted.sort((a, b) => a.price - b.price);

        case 'price-high':
            return sorted.sort((a, b) => b.price - a.price);

        case 'name-az':
            return sorted.sort((a, b) => a.name.localeCompare(b.name));

        case 'name-za':
            return sorted.sort((a, b) => b.name.localeCompare(a.name));

        case 'default':
        default:
            return sorted; // Keep original order
    }
};

/**
 * Get all unique categories from products
 */
export const getAllCategories = (products: ProductFull[]): string[] => {
    const categoriesSet = new Set<string>();

    products.forEach(product => {
        product.category.forEach(cat => categoriesSet.add(cat));
    });

    return Array.from(categoriesSet).sort();
};

/**
 * Get price range from products
 */
export const getPriceRange = (products: ProductFull[]): { min: number; max: number } => {
    if (products.length === 0) {
        return { min: 0, max: 10000 };
    }

    const prices = products.map(p => p.price);
    return {
        min: Math.min(...prices),
        max: Math.max(...prices)
    };
};
