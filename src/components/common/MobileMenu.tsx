import { FC, useEffect } from 'react';
import Link from 'next/link';
import { WHATSAPP_NUMBER, INSTAGRAM_LINK } from '../../data/constants';
import { Icon } from './Icon';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MobileMenu: FC<MobileMenuProps> = ({ isOpen, onClose }) => {
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    return (
        <>
            <div className={`mobile-menu-backdrop ${isOpen ? 'active' : ''}`} onClick={onClose} aria-hidden="true" />
            <div className={`mobile-menu ${isOpen ? 'active' : ''}`} role="dialog" aria-modal="true">
                <div className="mobile-menu-header">
                    <h2>Menu</h2>
                    <button className="mobile-menu-close" onClick={onClose} aria-label="Close menu">
                        <Icon name="fa-times" />
                    </button>
                </div>
                <nav className="mobile-menu-nav">
                    <Link href="/collection" className="mobile-menu-link" onClick={onClose}>
                        <Icon name="fa-shopping-bag" />
                        <span>Shop Collection</span>
                    </Link>
                    <div className="mobile-menu-sublinks" style={{ paddingLeft: '3rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingBottom: '1rem' }}>
                        <Link href="/hard-tennis-bats" onClick={onClose} style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.95rem' }}>Hard Tennis</Link>
                        <Link href="/soft-tennis-bats" onClick={onClose} style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.95rem' }}>Soft Tennis</Link>
                        <Link href="/leather-cricket-bats" onClick={onClose} style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.95rem' }}>Leather Bat</Link>
                    </div>
                    <Link href="/blog" className="mobile-menu-link" onClick={onClose}>
                        <Icon name="fa-newspaper" />
                        <span>Wular Insights (Blog)</span>
                    </Link>
                    <Link href="/about" className="mobile-menu-link" onClick={onClose}>
                        <Icon name="fa-info-circle" />
                        <span>About Us</span>
                    </Link>
                    <div className="mobile-menu-divider"></div>
                    <Link href="/privacy-policy" className="mobile-menu-link mobile-menu-link-secondary" onClick={onClose}><span>Privacy Policy</span></Link>
                    <Link href="/return-policy" className="mobile-menu-link mobile-menu-link-secondary" onClick={onClose}><span>Return Policy</span></Link>
                    <Link href="/terms-conditions" className="mobile-menu-link mobile-menu-link-secondary" onClick={onClose}><span>Terms &amp; Conditions</span></Link>
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
                    <p className="mobile-menu-copyright">© 2026 Wular Sports</p>
                </div>
            </div>
        </>
    );
};
