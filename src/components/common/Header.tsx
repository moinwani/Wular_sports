import { FC, useState, memo, MouseEvent, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { View } from '../../types';
import { MobileMenu } from './MobileMenu';
import { SearchBar } from './SearchBar';

export interface HeaderProps {
    onCartClick: () => void;
    cartItemCount: number;
    onNavigate: (view: View) => void;
}

export const Header: FC<HeaderProps> = memo(({ onCartClick, cartItemCount, onNavigate }) => {
    const location = useLocation();
    const [isLogoDimmed, setIsLogoDimmed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [isHeaderPinned, setIsHeaderPinned] = useState(false);
    const lastScrollY = useRef(0);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // Only show trust banner on homepage
    const isHomePage = location.pathname === '/';

    // Handle scroll direction detection for auto-hide header
    useEffect(() => {
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const currentScrollY = window.scrollY;
                    const scrollDifference = currentScrollY - lastScrollY.current;
                    
                    // Clear any existing timeout
                    if (scrollTimeoutRef.current) {
                        clearTimeout(scrollTimeoutRef.current);
                    }

                    // Only auto-hide if header is not pinned (user hasn't interacted)
                    if (!isHeaderPinned) {
                        if (scrollDifference > 5 && currentScrollY > 100) {
                            // Scrolling down - hide header
                            setIsHeaderVisible(false);
                        } else if (scrollDifference < -5) {
                            // Scrolling up - show header
                            setIsHeaderVisible(true);
                        }
                    }

                    // If at top of page, always show header
                    if (currentScrollY < 50) {
                        setIsHeaderVisible(true);
                    }

                    lastScrollY.current = currentScrollY;
                    ticking = false;
                });

                ticking = true;
            }
        };

        // Pin header when user interacts with it
        const handleHeaderInteraction = () => {
            setIsHeaderPinned(true);
            setIsHeaderVisible(true);
            
            // Unpin after 3 seconds of no scroll
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
            
            scrollTimeoutRef.current = setTimeout(() => {
                setIsHeaderPinned(false);
            }, 3000);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // Add event listeners to header elements to pin on interaction
        const headerElement = document.querySelector('.header');
        if (headerElement) {
            headerElement.addEventListener('mouseenter', handleHeaderInteraction);
            headerElement.addEventListener('click', handleHeaderInteraction);
        }

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (headerElement) {
                headerElement.removeEventListener('mouseenter', handleHeaderInteraction);
                headerElement.removeEventListener('click', handleHeaderInteraction);
            }
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, [isHeaderPinned]);

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
            {/* Trust Banner - Only on Homepage */}
            {isHomePage && (
                <div className={`trust-banner ${isHeaderVisible ? 'visible' : 'hidden'}`}>
                    <div className="trust-banner-content">
                        <span><i className="fas fa-shield-alt"></i> Secure Checkout</span>
                        <span><i className="fas fa-truck"></i> Free Shipping</span>
                        <span><i className="fas fa-undo"></i> Easy Returns</span>
                        <span><i className="fas fa-certificate"></i> Authentic Products</span>
                    </div>
                </div>
            )}
            <header className={`header ${isHeaderVisible ? 'header-visible' : 'header-hidden'}`}>
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

                    <div className="nav-section-right">
                        {/* Desktop Search Icon */}
                        <div className="desktop-search-toggle">
                            {isSearchOpen ? (
                                <div className="search-expanded-wrapper">
                                    <SearchBar autoFocus />
                                    <button
                                        className="search-close-btn"
                                        onClick={() => setIsSearchOpen(false)}
                                        aria-label="Close search"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            ) : (
                                <button
                                    className="search-icon-btn"
                                    onClick={() => setIsSearchOpen(true)}
                                    aria-label="Open search"
                                >
                                    <i className="fas fa-search"></i>
                                </button>
                            )}
                        </div>

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
