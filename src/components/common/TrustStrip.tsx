import { FC } from 'react';

const BADGES = [
    { icon: 'fas fa-hammer',         label: 'Handmade in Kashmir' },
    { icon: 'fas fa-shipping-fast',  label: 'Free Delivery in India' },
    { icon: 'fas fa-leaf',           label: 'Genuine Willow' },
    { icon: 'fab fa-whatsapp',       label: 'WhatsApp Support' },
    { icon: 'fas fa-undo-alt',       label: 'Easy Returns' },
];

export const TrustStrip: FC = () => (
    <div className="trust-strip" aria-label="Trust badges">
        <div className="trust-strip__track">
            {BADGES.map(({ icon, label }) => (
                <div key={label} className="trust-strip__badge">
                    <i className={icon} aria-hidden="true"></i>
                    <span>{label}</span>
                </div>
            ))}
        </div>
    </div>
);
