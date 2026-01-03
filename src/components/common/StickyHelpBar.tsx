import { memo } from 'react';
import { createWhatsAppLink } from '../../utils/helpers';

export const StickyHelpBar = memo(() => {
    return (
        <div className="help-bar-sticky">
            <div className="help-bar-content">
                <span className="help-bar-text">Need Help Choosing? We're here to help!</span>
                <div className="help-bar-actions">
                    <a 
                        href={createWhatsAppLink('Hello! I need help choosing a cricket bat.')} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="help-bar-btn whatsapp"
                    >
                        <i className="fab fa-whatsapp"></i>
                        <span>Chat on WhatsApp</span>
                        <span className="help-response-time">Typically replies within 5 min</span>
                    </a>
                    <a 
                        href="tel:+919320622451" 
                        className="help-bar-btn call"
                    >
                        <i className="fas fa-phone"></i>
                        <span>Call Us</span>
                    </a>
                </div>
            </div>
        </div>
    );
});

