import { FC, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { products } from '../../data/products';
import { getSearchSuggestions, getPopularSearches } from '../../utils/search';

interface SearchBarProps {
    onSearch?: (query: string) => void;
    placeholder?: string;
    autoFocus?: boolean;
}

export const SearchBar: FC<SearchBarProps> = ({
    onSearch,
    placeholder = 'Search for cricket bats...',
    autoFocus = false
}) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Update suggestions when query changes
    useEffect(() => {
        if (query.trim()) {
            const newSuggestions = getSearchSuggestions(products, query);
            setSuggestions(newSuggestions);
            setShowSuggestions(newSuggestions.length > 0);
        } else {
            setSuggestions(getPopularSearches());
            setShowSuggestions(false);
        }
    }, [query]);

    // Handle click outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keyboard shortcuts (Ctrl+K to focus)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSearch = (searchQuery: string) => {
        const trimmedQuery = searchQuery.trim();
        if (trimmedQuery) {
            if (onSearch) {
                onSearch(trimmedQuery);
            } else {
                navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
            }
            setShowSuggestions(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(query);
    };

    const handleSuggestionClick = (suggestion: string) => {
        setQuery(suggestion);
        handleSearch(suggestion);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0) {
                    handleSuggestionClick(suggestions[selectedIndex]);
                } else {
                    handleSubmit(e);
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                setSelectedIndex(-1);
                break;
        }
    };

    return (
        <div className="search-bar-container">
            <form onSubmit={handleSubmit} className="search-bar-form">
                <div className="search-input-wrapper">
                    <i className="fas fa-search search-icon"></i>
                    <input
                        ref={inputRef}
                        type="text"
                        className="search-input"
                        placeholder={placeholder}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                        onKeyDown={handleKeyDown}
                        autoFocus={autoFocus}
                        aria-label="Search products"
                        aria-autocomplete="list"
                        aria-controls="search-suggestions"
                        aria-expanded={showSuggestions}
                    />
                    {query && (
                        <button
                            type="button"
                            className="search-clear-btn"
                            onClick={() => {
                                setQuery('');
                                setShowSuggestions(false);
                                inputRef.current?.focus();
                            }}
                            aria-label="Clear search"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    )}
                    <span className="search-shortcut">Ctrl+K</span>
                </div>
            </form>

            {showSuggestions && suggestions.length > 0 && (
                <div
                    ref={suggestionsRef}
                    className="search-suggestions"
                    id="search-suggestions"
                    role="listbox"
                >
                    {!query.trim() && (
                        <div className="search-suggestions-header">Popular Searches</div>
                    )}
                    {suggestions.map((suggestion, index) => (
                        <div
                            key={suggestion}
                            className={`search-suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                            onClick={() => handleSuggestionClick(suggestion)}
                            role="option"
                            aria-selected={index === selectedIndex}
                        >
                            <i className="fas fa-search suggestion-icon"></i>
                            <span>{suggestion}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
