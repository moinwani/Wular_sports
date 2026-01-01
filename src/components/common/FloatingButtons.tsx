import React, { memo, useState } from 'react';
import { createWhatsAppLink } from '../../utils/helpers';
import { INSTAGRAM_LINK, YOUTUBE_LINK } from '../../data/constants';

export const FloatingButtons = memo(() => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className={`fab-container ${isOpen ? 'open' : ''}`}>
            <div className="fab-options">
                <a href={createWhatsAppLink('Hello!')} target="_blank" rel="noopener noreferrer" className="fab-option" aria-label="WhatsApp"><i className="fab fa-whatsapp"></i></a>
                <a href={YOUTUBE_LINK} target="_blank" rel="noopener noreferrer" className="fab-option" aria-label="YouTube"><i className="fab fa-youtube"></i></a>
                <a href={INSTAGRAM_LINK} target="_blank" rel="noopener noreferrer" className="fab-option" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
            </div>
            <button className="fab-main" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle contact options" aria-expanded={isOpen}><i className={`fas ${isOpen ? 'fa-times' : 'fa-comment-dots'}`}></i></button>
        </div>
    );
});

export const FloatingCallButton = memo(() => (
    <a href="tel:+919320622451" className="fab-call" aria-label="Call us">
        <i className="fas fa-phone"></i>
    </a>
));
