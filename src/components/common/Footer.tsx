import { FC, memo } from 'react';
import { View } from '../../types';

export interface FooterProps {
    onNavigate: (view: View) => void;
}

export const Footer: FC<FooterProps> = memo(({ onNavigate }) => (
    <footer className="footer">
        <div className="container">
            <div className="footer-links">
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('privacy'); }}>Privacy Policy</a> |
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('return'); }}>Return Policy</a> |
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('terms'); }}>Terms & Conditions</a>
            </div>
            <p className="footer-copyright">© 2025 Wular Sports. All rights reserved.</p>
        </div>
    </footer>
));
