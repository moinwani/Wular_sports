import { FC, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchBar } from './SearchBar';
import { View } from '../../types';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: View) => void;
}

export const MobileMenu: FC<MobileMenuProps> = ({ isOpen, onClose, onNavigate }) => {
    const navigate = useNavigate();
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

    const handleNavigate = (view: View) => {
        onNavigate(view);
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

                <div style={{ padding: '0 1.5rem 1.5rem' }}>
                    <SearchBar onSearch={(q) => {
                        navigate(`/search?q=${encodeURIComponent(q)}`);
                        onClose();
                    }} />
                </div>
                <nav className="mobile-menu-nav">
                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); handleNavigate('home'); }}
                        className="mobile-menu-link"
                    >
                        <i className="fas fa-home"></i>
                        <span>Home</span>
                    </a>

                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); handleNavigate('collection'); }}
                        className="mobile-menu-link"
                    >
                        <i className="fas fa-shopping-bag"></i>
                        <span>Shop Collection</span>
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
                        <a href="https://instagram.com/wular_sports" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                            <i className="fab fa-instagram"></i>
                        </a>
                        <a href="https://facebook.com/wularsports" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                            <i className="fab fa-facebook"></i>
                        </a>
                        <a href="https://wa.me/919906353535" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                            <i className="fab fa-whatsapp"></i>
                        </a>
                    </div>
                    <p className="mobile-menu-copyright">© 2026 Wular Sports</p>
                </div>
            </div>
        </>
    );
};
