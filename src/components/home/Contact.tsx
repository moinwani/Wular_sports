import React, { memo } from 'react';
import { createWhatsAppLink } from '../../utils/helpers';
import { INSTAGRAM_LINK, YOUTUBE_LINK } from '../../data/constants';

export const Contact = memo(() => (
    <section id="contact">
        <div className="container">
            <h2 className="section-title">Get In Touch</h2>
            <p>Have questions? Reach out to us directly!</p>
            <a href={createWhatsAppLink("Hello, I have a question.")} target="_blank" rel="noopener noreferrer" className="btn">Chat on WhatsApp</a>
            <div className="social-icons">
                <a href={INSTAGRAM_LINK} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
                <a href={YOUTUBE_LINK} target="_blank" rel="noopener noreferrer" aria-label="YouTube"><i className="fab fa-youtube"></i></a>
            </div>
            <div className="contact-email">
                <p>or email us at: <a href="mailto:wularsports@gmail.com">wularsports@gmail.com</a></p>
            </div>
        </div>
    </section>
));
