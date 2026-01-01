import { FC } from 'react';
import { SortOption } from '../../utils/filtering';

interface SortDropdownProps {
    value: SortOption;
    onChange: (option: SortOption) => void;
}

export const SortDropdown: FC<SortDropdownProps> = ({ value, onChange }) => {
    return (
        <div className="sort-dropdown">
            <label htmlFor="sort-select" className="sort-label">
                <i className="fas fa-sort"></i>
                <span>Sort By:</span>
            </label>
            <select
                id="sort-select"
                className="sort-select"
                value={value}
                onChange={(e) => onChange(e.target.value as SortOption)}
            >
                <option value="default">Default</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-az">Name: A to Z</option>
                <option value="name-za">Name: Z to A</option>
            </select>
        </div>
    );
};
