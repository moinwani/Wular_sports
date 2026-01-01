import { memo } from 'react';
import { createWhatsAppLink } from '../../utils/helpers';

export const FloatingButtons = memo(() => {
    return (
        <a
            href={createWhatsAppLink('Hello!')}
            target="_blank"
            rel="noopener noreferrer"
            className="fab-whatsapp"
            aria-label="Contact us on WhatsApp"
        >
            <i className="fab fa-whatsapp"></i>
        </a>
    );
});

export const FloatingCallButton = memo(() => (
    <a href="tel:+919320622451" className="fab-call" aria-label="Call us">
        <i className="fas fa-phone"></i>
    </a>
));
