import { FC, ReactNode, memo } from 'react';
import { Icon } from './Icon';

export interface SidebarProps {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
    children: ReactNode;
    footer: ReactNode;
}

export const Sidebar: FC<SidebarProps> = memo(({ title, isOpen, onClose, onBack, children, footer }) => (
    <>
        <div className={`overlay ${isOpen ? 'show' : ''}`} onClick={onClose}></div>
        {/* A <div>, not <aside>: the "dialog" role isn't allowed on <aside> (flagged by PageSpeed).
            While closed it is inert, so screen readers and AI agents skip the hidden panel. */}
        <div className={`sidebar ${isOpen ? 'open' : ''}`} role="dialog" aria-modal="true" aria-labelledby="sidebar-title" inert={!isOpen}>
            <div className="sidebar-header">
                {onBack && <button onClick={onBack} className="back-btn"><Icon name="fa-arrow-left" aria-hidden="true" /> Back to Cart</button>}
                <h3 className="sidebar-title" id="sidebar-title">{title}</h3>
                <button onClick={onClose} className="close-btn" aria-label="Close sidebar"><Icon name="fa-times" aria-hidden="true" /></button>
            </div>
            <div className="sidebar-content">{children}</div>
            <div className="sidebar-footer">{footer}</div>
        </div>
    </>
));
