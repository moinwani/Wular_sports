import { FC, useState, memo, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { MobileMenu } from './MobileMenu';
import { useCart } from '../../context/CartContext';
import { getCDNUrl } from '../../services/githubService';
import { Icon } from './Icon';
import { useCatalog } from '../../context/CatalogContext';

const LOGO_URL = getCDNUrl('assets/images/brand/logo.png');

export const Header: FC = memo(() => {
    const router = useRouter();
    const { cartItemCount, openCart } = useCart();
    const navCategories = useCatalog().categories.filter(c => c.showInNav);
    const [isLogoDimmed, setIsLogoDimmed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [isHeaderPinned, setIsHeaderPinned] = useState(false);
    const lastScrollY = useRef(0);
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Pinned = the visitor just touched the header: keep it showing for 3 s.
    // (A ref, so the listeners below are set up once — re-subscribing on every
    // change used to cancel the 3-second timer and leave the header stuck.)
    const pinnedRef = useRef(false);
    useEffect(() => { pinnedRef.current = isHeaderPinned; }, [isHeaderPinned]);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const diff = currentScrollY - lastScrollY.current;
            if (!pinnedRef.current) {
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
            headerElement.addEventListener('touchstart', handleHeaderInteraction, { passive: true });
        }
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (headerElement) {
                headerElement.removeEventListener('mouseenter', handleHeaderInteraction);
                headerElement.removeEventListener('touchstart', handleHeaderInteraction);
            }
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        };
    }, []);

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
                        <Link href="/collection" className="nav-link">Shop All</Link>
                        {navCategories.map(c => (
                            <Link key={c.id} href={c.path} className="nav-link">{c.navLabel}</Link>
                        ))}
                    </div>

                    <Link
                        href="/"
                        className="nav-brand-centered"
                        aria-label="Go to homepage"
                        onClick={() => { setIsLogoDimmed(true); setTimeout(() => setIsLogoDimmed(false), 300); }}
                    >
                        <Image
                            src={LOGO_URL}
                            alt="Wular Sports Logo"
                            className={`nav-logo-centered ${isLogoDimmed ? 'dimming' : ''}`}
                            width={135}
                            height={75}
                            priority
                        />
                    </Link>

                    <div className="nav-section-right">
                        <Link href="/blog" className="nav-link">Blog</Link>
                        <Link href="/about" className="nav-link">About</Link>
                        <button type="button" className="nav-cart" onClick={openCart} aria-label={cartItemCount > 0 ? `Open cart (${cartItemCount} item${cartItemCount === 1 ? '' : 's'})` : 'Open cart'}>
                            <Icon name="fa-shopping-cart" aria-hidden="true" />
                            {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
                            <span className="cart-text">Cart</span>
                        </button>
                    </div>
                </nav>
            </header>

            <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        </>
    );
});

Header.displayName = 'Header';
