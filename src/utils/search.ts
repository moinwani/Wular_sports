import { ProductFull } from '../types';

/**
 * Fuzzy search algorithm for products
 * Searches in product name, description, and categories
 */
export const searchProducts = (
    products: ProductFull[],
    query: string
): ProductFull[] => {
    if (!query.trim()) {
        return products;
    }

    const searchTerm = query.toLowerCase().trim();

    return products.filter(product => {
        // Search in product name
        const nameMatch = product.name.toLowerCase().includes(searchTerm);

        // Search in description
        const descriptionMatch = product.description.toLowerCase().includes(searchTerm);

        // Search in categories
        const categoryMatch = product.category.some(cat =>
            cat.toLowerCase().includes(searchTerm)
        );

        return nameMatch || descriptionMatch || categoryMatch;
    });
};

/**
 * Get search suggestions based on partial query
 */
export const getSearchSuggestions = (
    products: ProductFull[],
    query: string,
    maxSuggestions: number = 5
): string[] => {
    if (!query.trim()) {
        return [];
    }

    const searchTerm = query.toLowerCase().trim();
    const suggestions = new Set<string>();

    products.forEach(product => {
        // Add product name if it matches
        if (product.name.toLowerCase().includes(searchTerm)) {
            suggestions.add(product.name);
        }

        // Add matching categories
        product.category.forEach(cat => {
            if (cat.toLowerCase().includes(searchTerm)) {
                suggestions.add(cat);
            }
        });
    });

    return Array.from(suggestions).slice(0, maxSuggestions);
};

/**
 * Highlight search term in text
 */
export const highlightSearchTerm = (text: string, searchTerm: string): string => {
    if (!searchTerm.trim()) {
        return text;
    }

    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
};

/**
 * Get popular search terms (can be customized based on analytics)
 */
export const getPopularSearches = (): string[] => {
    return [
        'Hard Tennis',
        'Soft Tennis',
        'Leather Bat'
    ];
};
