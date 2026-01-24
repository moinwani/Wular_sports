import { FC, useEffect } from 'react';
import { View } from '../../types';
import { WHATSAPP_NUMBER, INSTAGRAM_LINK } from '../../data/constants';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: View) => void;
}

export const MobileMenu: FC<MobileMenuProps> = ({ isOpen, onClose, onNavigate }) => {
    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleNavigate = (view: View, hash?: string) => {
        onNavigate(view);
        if (hash) {
            // Wait for navigation and then scroll to hash
            setTimeout(() => {
                const element = document.getElementById(hash);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 500);
        }
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`mobile-menu-backdrop ${isOpen ? 'active' : ''}`}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Menu */}
            <div className={`mobile-menu ${isOpen ? 'active' : ''}`} role="dialog" aria-modal="true">
                <div className="mobile-menu-header">
                    <h2>Menu</h2>
                    <button
                        className="mobile-menu-close"
                        onClick={onClose}
                        aria-label="Close menu"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <nav className="mobile-menu-nav">
                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); handleNavigate('collection'); }}
                        className="mobile-menu-link"
                    >
                        <i className="fas fa-shopping-bag"></i>
                        <span>Shop Collection</span>
                    </a>

                    {/* Category Links */}
                    <div className="mobile-menu-sublinks" style={{ paddingLeft: '3rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingBottom: '1rem' }}>
                        <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); handleNavigate('hard-tennis'); }}
                            style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.95rem' }}
                        >
                            Hard Tennis
                        </a>
                        <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); handleNavigate('soft-tennis'); }}
                            style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.95rem' }}
                        >
                            Soft Tennis
                        </a>
                        <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); handleNavigate('leather-bats'); }}
                            style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.95rem' }}
                        >
                            Leather Bat
                        </a>
                    </div>

                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); handleNavigate('blog'); }}
                        className="mobile-menu-link"
                    >
                        <i className="fas fa-newspaper"></i>
                        <span>Wular Insights (Blog)</span>
                    </a>

                    <div className="mobile-menu-divider"></div>

                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); handleNavigate('privacy'); }}
                        className="mobile-menu-link mobile-menu-link-secondary"
                    >
                        <span>Privacy Policy</span>
                    </a>

                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); handleNavigate('return'); }}
                        className="mobile-menu-link mobile-menu-link-secondary"
                    >
                        <span>Return Policy</span>
                    </a>

                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); handleNavigate('terms'); }}
                        className="mobile-menu-link mobile-menu-link-secondary"
                    >
                        <span>Terms & Conditions</span>
                    </a>
                </nav>

                <div className="mobile-menu-footer">
                    <div className="mobile-menu-social">
                        <a href={INSTAGRAM_LINK} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                            <i className="fab fa-instagram"></i>
                        </a>
                        <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                            <i className="fab fa-whatsapp"></i>
                        </a>
                    </div>
                    <p className="mobile-menu-copyright">© 2026 Wular Sports</p>
                </div>
            </div>
        </>
    );
};
