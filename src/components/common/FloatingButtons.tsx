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
                window.dataLayer.push({ event: 'whatsapp_click', source: 'floating_button', type: 'general_inquiry' });
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
