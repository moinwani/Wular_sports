import { FC, useState, memo, MouseEvent, useEffect, useRef } from 'react';
import { View } from '../../types';
import { MobileMenu } from './MobileMenu';
import { getFileSHA, getCDNUrl } from '../../services/githubService';

export interface HeaderProps {
    onCartClick: () => void;
    cartItemCount: number;
    onNavigate: (view: View) => void;
}

export const Header: FC<HeaderProps> = memo(({ onCartClick, cartItemCount, onNavigate }) => {
    const [isLogoDimmed, setIsLogoDimmed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [isHeaderPinned, setIsHeaderPinned] = useState(false);
    const [logoUrl, setLogoUrl] = useState('https://cdn.jsdelivr.net/gh/moinwani/Wular_sports@main/assets/images/brand/logo.png');
    const lastScrollY = useRef(0);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Dynamic Logo Cache Busting
    useEffect(() => {
        async function fetchLogo() {
            const sha = await getFileSHA('assets/images/brand/logo.png');
            if (sha) {
                setLogoUrl(getCDNUrl('assets/images/brand/logo.png', sha));
            }
        }
        fetchLogo();
    }, []);

    // Handle scroll direction detection for auto-hide header
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const scrollDifference = currentScrollY - lastScrollY.current;

            // Only auto-hide if header is not pinned (user hasn't interacted)
            if (!isHeaderPinned) {
                // If at top of page (within 50px), always show header
                if (currentScrollY < 50) {
                    setIsHeaderVisible(true);
                }
                // Scrolling down - hide header (threshold of 100px from top and 5px scroll)
                else if (scrollDifference > 5 && currentScrollY > 100) {
                    setIsHeaderVisible(false);
                }
                // Scrolling up - show header
                else if (scrollDifference < -5) {
                    setIsHeaderVisible(true);
                }
            }

            lastScrollY.current = currentScrollY;
        };

        // Pin header when user interacts with it
        const handleHeaderInteraction = () => {
            setIsHeaderPinned(true);
            setIsHeaderVisible(true);

            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }

            scrollTimeoutRef.current = setTimeout(() => {
                setIsHeaderPinned(false);
            }, 3000);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        const headerElement = document.querySelector('.header') as HTMLElement;
        if (headerElement) {
            headerElement.addEventListener('mouseenter', handleHeaderInteraction);
            headerElement.addEventListener('touchstart', handleHeaderInteraction);
        }

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (headerElement) {
                headerElement.removeEventListener('mouseenter', handleHeaderInteraction);
                headerElement.removeEventListener('touchstart', handleHeaderInteraction);
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
            <header className={`header ${isHeaderVisible ? 'header-visible' : 'header-hidden'}`}>
                {/* Row 1: Main Navigation Bar */}
                <nav className="nav">
                    {/* Left: Hamburger (mobile) + Nav Links (desktop) */}
                    <div className="nav-section-left">
                        <button
                            className="hamburger-btn"
                            onClick={() => setIsMobileMenuOpen(true)}
                            aria-label="Open menu"
                            aria-expanded={isMobileMenuOpen}
                        >
                            <i className="fas fa-bars"></i>
                        </button>
                        <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('hard-tennis'); }} className="nav-link">Hard Tennis</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('soft-tennis'); }} className="nav-link">Soft Tennis</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('leather-bats'); }} className="nav-link">Leather Bats</a>
                    </div>

                    {/* Center: Logo */}
                    <a href="#" onClick={handleLogoClick} className="nav-brand-centered" aria-label="Go to homepage">
                        <img
                            src={logoUrl}
                            alt="Wular Sports Logo"
                            className={`nav-logo-centered ${isLogoDimmed ? 'dimming' : ''}`}
                        />
                    </a>

                    {/* Right: Nav Links (desktop) + Cart */}
                    <div className="nav-section-right">
                        <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('blog'); }} className="nav-link">Blog</a>
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
