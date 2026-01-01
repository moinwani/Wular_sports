import { FC, useState, memo, MouseEvent } from 'react';
import { View } from '../../types';
import { MobileMenu } from './MobileMenu';
import { SearchBar } from './SearchBar';

export interface HeaderProps {
    onCartClick: () => void;
    cartItemCount: number;
    onNavigate: (view: View) => void;
}

export const Header: FC<HeaderProps> = memo(({ onCartClick, cartItemCount, onNavigate }) => {
    const [isLogoDimmed, setIsLogoDimmed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogoClick = (e: MouseEvent) => {
        e.preventDefault();

        // Dim the logo
        setIsLogoDimmed(true);

        // After a short delay, un-dim it
        setTimeout(() => {
            setIsLogoDimmed(false);
        }, 300); // This duration should feel snappy

        // Navigate to home
        onNavigate('home');
    };

    return (
        <>
            <header className="header">
                <nav className="nav">
                    {/* Hamburger Menu Button (Mobile Only) */}
                    <button
                        className="hamburger-btn"
                        onClick={() => setIsMobileMenuOpen(true)}
                        aria-label="Open menu"
                        aria-expanded={isMobileMenuOpen}
                    >
                        <i className="fas fa-bars"></i>
                    </button>

                    <a href="#" onClick={handleLogoClick} className="nav-brand-centered" aria-label="Go to homepage">
                        <img
                            src="https://res.cloudinary.com/ddahm5ebv/image/upload/v1752992278/6334704126398678409-removebg-preview_dvxsud.png"
                            alt="Wular Sports Logo"
                            className={`nav-logo-centered ${isLogoDimmed ? 'dimming' : ''}`}
                        />
                    </a>

                    {/* Search Bar (Desktop Only) */}
                    <div className="nav-search-wrapper">
                        <SearchBar />
                    </div>

                    <div className="nav-section-right">
                        <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('collection'); }} className="nav-link">Shop Collection</a>
                        <div className="nav-cart" onClick={onCartClick} role="button" aria-label="Open cart">
                            <i className="fas fa-shopping-cart" aria-hidden="true"></i>
                            {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
                            <span className="cart-text">Cart</span>
                        </div>
                    </div>
                </nav>
            </header>

            {/* Mobile Menu */}
            <MobileMenu
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                onNavigate={onNavigate}
            />
        </>
    );
});
