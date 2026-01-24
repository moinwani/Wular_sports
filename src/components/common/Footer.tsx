import { FC, memo, useState } from 'react';
import { View } from '../../types';
import { createWhatsAppLink } from '../../utils/helpers';
import { INSTAGRAM_LINK, YOUTUBE_LINK } from '../../data/constants';
import { subscribeToNewsletter } from '../../services/newsletter';

export interface FooterProps {
    onNavigate: (view: View) => void;
    showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const Footer: FC<FooterProps> = memo(({ onNavigate, showToast }) => {
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setSubmitting(true);
        const result = await subscribeToNewsletter(email);

        if (result.success) {
            showToast?.(result.message, 'success');
            setEmail('');
        } else {
            showToast?.(result.message, result.message.includes('already') ? 'info' : 'error');
        }
        setSubmitting(false);
    };

    return (
        <footer className="footer-master">
            {/* 1. Get In Touch Section */}
            <div className="footer-contact-section">
                <div className="container">
                    <h2 className="footer-section-title">Get In Touch</h2>
                    <div className="footer-title-bar"></div>
                    <p className="footer-contact-hint">Have questions? Reach out to us directly!</p>
                    <a href={createWhatsAppLink("Hello, I have a question.")} target="_blank" rel="noopener noreferrer" className="btn-chat-whatsapp">
                        Chat on WhatsApp
                    </a>
                    <p className="footer-email-hint">or email us at: <a href="mailto:wularsports@gmail.com">wularsports@gmail.com</a></p>
                </div>
            </div>

            {/* 2. Subscribe Section (Competitor Style) */}
            <div className="footer-subscribe-section">
                <div className="container">
                    <h3 className="subscribe-title">SUBSCRIBE TO OUR EMAILS</h3>
                    <form className="footer-pill-form" onSubmit={handleSubscribe}>
                        <div className="pill-input-wrapper">
                            <input
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={submitting}
                            />
                            <button type="submit" className="pill-submit-btn" disabled={submitting} aria-label="Subscribe">
                                <i className={`fas ${submitting ? 'fa-spinner fa-spin' : 'fa-arrow-right'}`}></i>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="footer-divider"></div>

            {/* 3. Bottom Bar */}
            <div className="footer-bottom-bar">
                <div className="container container-flex">
                    <div className="footer-legal">
                        <div className="footer-seo-links" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                            <a href="/hard-tennis-bats" className="legal-link">Hard Tennis Bats</a>
                            <a href="/soft-tennis-bats" className="legal-link">Soft Tennis Bats</a>
                            <a href="/leather-cricket-bats" className="legal-link">Leather Cricket Bats</a>
                        </div>
                        <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('terms'); }} className="legal-link">TERMS AND POLICIES</a>
                        <span className="copyright">© 2026 WULAR SPORTS</span>
                    </div>

                    <div className="footer-social-group">
                        <a href={INSTAGRAM_LINK} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                            <i className="fab fa-instagram"></i>
                        </a>
                        <a href={YOUTUBE_LINK} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                            <i className="fab fa-youtube"></i>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
});
