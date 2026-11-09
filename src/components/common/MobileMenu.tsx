import { FC, useEffect } from 'react';
import Link from 'next/link';
import { WHATSAPP_NUMBER, INSTAGRAM_LINK } from '../../data/constants';
import { Icon } from './Icon';
import { useCatalog } from '../../context/CatalogContext';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MobileMenu: FC<MobileMenuProps> = ({ isOpen, onClose }) => {
    const { categories } = useCatalog();
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    return (
        <>
            <div className={`mobile-menu-backdrop ${isOpen ? 'active' : ''}`} onClick={onClose} aria-hidden="true" />
            {/* Links don't prefetch: the closed menu sits just off-screen, so Next.js would
                otherwise download every linked page while this page is still opening */}
            <div className={`mobile-menu ${isOpen ? 'active' : ''}`} role="dialog" aria-modal="true" aria-label="Menu" inert={!isOpen}>
                <div className="mobile-menu-header">
                    <p className="mobile-menu-title">Menu</p>
                    <button className="mobile-menu-close" onClick={onClose} aria-label="Close menu">
                        <Icon name="fa-times" />
                    </button>
                </div>
                <nav className="mobile-menu-nav">
                    <Link prefetch={false} href="/collection" className="mobile-menu-link" onClick={onClose}>
                        <Icon name="fa-shopping-bag" />
                        <span>Shop Collection</span>
                    </Link>
                    <div className="mobile-menu-sublinks" style={{ paddingLeft: '3rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingBottom: '1rem' }}>
                        {categories.filter(c => c.showInNav).map(c => (
                            <Link prefetch={false} key={c.id} href={c.path} onClick={onClose} style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.95rem' }}>{c.navLabel}</Link>
                        ))}
                    </div>
                    <Link prefetch={false} href="/blog" className="mobile-menu-link" onClick={onClose}>
                        <Icon name="fa-newspaper" />
                        <span>Wular Insights (Blog)</span>
                    </Link>
                    <Link prefetch={false} href="/about" className="mobile-menu-link" onClick={onClose}>
                        <Icon name="fa-info-circle" />
                        <span>About Us</span>
                    </Link>
                    <div className="mobile-menu-divider"></div>
                    <Link prefetch={false} href="/privacy-policy" className="mobile-menu-link mobile-menu-link-secondary" onClick={onClose}><span>Privacy Policy</span></Link>
                    <Link prefetch={false} href="/return-policy" className="mobile-menu-link mobile-menu-link-secondary" onClick={onClose}><span>Return Policy</span></Link>
                    <Link prefetch={false} href="/terms-conditions" className="mobile-menu-link mobile-menu-link-secondary" onClick={onClose}><span>Terms &amp; Conditions</span></Link>
                </nav>
                <div className="mobile-menu-footer">
                    <div className="mobile-menu-social">
                        <a href={INSTAGRAM_LINK} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Icon name="fa-instagram" /></a>
                        <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" onClick={() => {
                            import('../../services/leads').then(({ trackWhatsAppClick }) =>
                                trackWhatsAppClick('mobile_menu')
                            ).catch(() => { /* best-effort */ });
                        }}><Icon name="fa-whatsapp" /></a>
                    </div>
                    <p className="mobile-menu-copyright">© {new Date().getFullYear()} Wular Sports</p>
                </div>
            </div>
        </>
    );
};
