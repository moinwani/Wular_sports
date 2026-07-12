import { memo } from 'react';
import { createWhatsAppLink } from '../../utils/helpers';
import { Icon } from './Icon';

export const FloatingButtons = memo(() => {
    return (
        <a
            href={createWhatsAppLink('Hello!')}
            target="_blank"
            rel="noopener noreferrer"
            className="fab-whatsapp"
            aria-label="Contact us on WhatsApp"
            onClick={() => {
                import('../../services/leads').then(({ trackWhatsAppClick }) =>
                    trackWhatsAppClick('floating_button')
                ).catch(() => { /* best-effort */ });
            }}
        >
            <Icon name="fa-whatsapp" />
        </a>
    );
});

export const FloatingCallButton = memo(() => (
    <a href="tel:+919320622451" className="fab-call" aria-label="Call us">
        <Icon name="fa-phone" />
    </a>
));
