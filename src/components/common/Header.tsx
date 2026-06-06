import { FC, useState, memo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { MobileMenu } from './MobileMenu';
import { useCart } from '../../context/CartContext';
import { getFileSHA, getCDNUrl } from '../../services/githubService';
import { Icon } from './Icon';

export const Header: FC = memo(() => {
    const router = useRouter();
    const { cartItemCount, openCart } = useCart();
    const [isLogoDimmed, setIsLogoDimmed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [isHeaderPinned, setIsHeaderPinned] = useState(false);
    const [logoUrl, setLogoUrl] = useState('https://cdn.jsdelivr.net/gh/moinwani/Wular_sports@main/assets/images/brand/logo.png');
    const lastScrollY = useRef(0);
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        async function fetchLogo() {
            const sha = await getFileSHA('assets/images/brand/logo.png');
            if (sha) setLogoUrl(getCDNUrl('assets/images/brand/logo.png', sha));
        }
        fetchLogo();
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const diff = currentScrollY - lastScrollY.current;
            if (!isHeaderPinned) {
                if (currentScrollY < 50) setIsHeaderVisible(true);
                else if (diff > 5 && currentScrollY > 100) setIsHeaderVisible(false);
                else if (diff < -5) setIsHeaderVisible(true);
            }
            lastScrollY.current = currentScrollY;
        };

        const handleHeaderInteraction = () => {
            setIsHeaderPinned(true);
            setIsHeaderVisible(true);
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
            scrollTimeoutRef.current = setTimeout(() => setIsHeaderPinned(false), 3000);
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
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        };
    }, [isHeaderPinned]);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [router.pathname]);

    return (
        <>
            <header className={`header ${isHeaderVisible ? 'header-visible' : 'header-hidden'}`}>
                <nav className="nav">
                    <div className="nav-section-left">
                        <button
                            className="hamburger-btn"
                            onClick={() => setIsMobileMenuOpen(true)}
                            aria-label="Open menu"
                            aria-expanded={isMobileMenuOpen}
                        >
                            <Icon name="fa-bars" />
                        </button>
                        <Link href="/hard-tennis-bats" className="nav-link">Hard Tennis</Link>
                        <Link href="/soft-tennis-bats" className="nav-link">Soft Tennis</Link>
                        <Link href="/leather-cricket-bats" className="nav-link">Leather Bats</Link>
                    </div>

                    <Link
                        href="/"
                        className="nav-brand-centered"
                        aria-label="Go to homepage"
                        onClick={() => { setIsLogoDimmed(true); setTimeout(() => setIsLogoDimmed(false), 300); }}
                    >
                        <img
                            src={logoUrl}
                            alt="Wular Sports Logo"
                            className={`nav-logo-centered ${isLogoDimmed ? 'dimming' : ''}`}
                        />
                    </Link>

                    <div className="nav-section-right">
                        <Link href="/blog" className="nav-link">Blog</Link>
                        <Link href="/about" className="nav-link">About</Link>
                        <div className="nav-cart" onClick={openCart} role="button" aria-label="Open cart">
                            <Icon name="fa-shopping-cart" aria-hidden="true" />
                            {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
                            <span className="cart-text">Cart</span>
                        </div>
                    </div>
                </nav>
            </header>

            <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        </>
    );
});

Header.displayName = 'Header';
