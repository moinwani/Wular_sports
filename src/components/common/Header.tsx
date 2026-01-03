import { FC, useState, memo, MouseEvent, useEffect, useRef } from 'react';
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
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [isHeaderPinned, setIsHeaderPinned] = useState(false);
    const lastScrollY = useRef(0);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Handle scroll direction detection for auto-hide header
    useEffect(() => {
        let ticking = false;
        let headerElementRef: HTMLElement | null = null;
        let lastKnownScroll = 0;

        const handleScroll = (event?: Event) => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    // Try multiple methods to detect scroll position
                    let currentScrollY = 0;
                    
                    // Check window scroll first
                    currentScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
                    
                    // If window scroll is 0 (might be locked), check scrollable containers
                    if (currentScrollY === 0) {
                        // Check for scrollable containers (product page image gallery, content section)
                        const imageGallery = document.querySelector('.vertical-gallery-scroll-container') as HTMLElement;
                        const contentSection = document.querySelector('.product-info-section-sticky') as HTMLElement;
                        
                        if (imageGallery && imageGallery.scrollTop > 0) {
                            currentScrollY = imageGallery.scrollTop + 100; // Add offset to simulate scroll
                        } else if (contentSection && contentSection.scrollTop > 0) {
                            currentScrollY = contentSection.scrollTop + 200; // Add offset
                        }
                    }
                    
                    const scrollDifference = currentScrollY - lastScrollY.current;
                    
                    // Clear any existing timeout
                    if (scrollTimeoutRef.current) {
                        clearTimeout(scrollTimeoutRef.current);
                    }

                    // Only auto-hide if header is not pinned (user hasn't interacted)
                    if (!isHeaderPinned) {
                        if (scrollDifference > 5 && currentScrollY > 80) {
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
                    lastKnownScroll = currentScrollY;
                    ticking = false;
                });

                ticking = true;
            }
        };

        // Also listen to scroll on scrollable containers
        const handleContainerScroll = () => {
            handleScroll();
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

        // Listen to scroll events with multiple methods for better compatibility
        window.addEventListener('scroll', handleScroll, { passive: true, capture: false });
        document.addEventListener('scroll', handleScroll, { passive: true, capture: false });
        document.documentElement.addEventListener('scroll', handleScroll, { passive: true });
        
        // Also listen to scroll on scrollable containers (for product pages)
        const imageGallery = document.querySelector('.vertical-gallery-scroll-container') as HTMLElement;
        const contentSection = document.querySelector('.product-info-section-sticky') as HTMLElement;
        
        if (imageGallery) {
            imageGallery.addEventListener('scroll', handleContainerScroll, { passive: true });
        }
        if (contentSection) {
            contentSection.addEventListener('scroll', handleContainerScroll, { passive: true });
        }
        
        // Listen to wheel events to detect scroll intent (works even when scroll is prevented)
        const handleWheel = (e: WheelEvent) => {
            if (!isHeaderPinned) {
                if (e.deltaY > 0 && lastKnownScroll > 80) {
                    // Scrolling down - hide header
                    setIsHeaderVisible(false);
                } else if (e.deltaY < 0) {
                    // Scrolling up - show header
                    setIsHeaderVisible(true);
                }
            }
        };
        window.addEventListener('wheel', handleWheel, { passive: true });
        
        // Initial scroll position check
        handleScroll();
        
        // Get header element reference
        headerElementRef = document.querySelector('.header') as HTMLElement;
        if (headerElementRef) {
            headerElementRef.addEventListener('mouseenter', handleHeaderInteraction);
            headerElementRef.addEventListener('click', handleHeaderInteraction);
            headerElementRef.addEventListener('touchstart', handleHeaderInteraction);
        }

        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('scroll', handleScroll);
            document.documentElement.removeEventListener('scroll', handleScroll);
            window.removeEventListener('wheel', handleWheel);
            
            // Remove container scroll listeners
            const imageGallery = document.querySelector('.vertical-gallery-scroll-container') as HTMLElement;
            const contentSection = document.querySelector('.product-info-section-sticky') as HTMLElement;
            if (imageGallery) {
                imageGallery.removeEventListener('scroll', handleContainerScroll);
            }
            if (contentSection) {
                contentSection.removeEventListener('scroll', handleContainerScroll);
            }
            
            if (headerElementRef) {
                headerElementRef.removeEventListener('mouseenter', handleHeaderInteraction);
                headerElementRef.removeEventListener('click', handleHeaderInteraction);
                headerElementRef.removeEventListener('touchstart', handleHeaderInteraction);
            }
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, [isHeaderPinned, isHeaderVisible]);

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
