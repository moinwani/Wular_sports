import { FC, memo, useState } from 'react';
import Link from 'next/link';
import { createWhatsAppLink } from '../../utils/helpers';
import { INSTAGRAM_LINK, YOUTUBE_LINK } from '../../data/constants';
import { subscribeToNewsletter } from '../../services/newsletter';
import { useToast } from '../../context/ToastContext';
import { Icon } from './Icon';

export const Footer: FC = memo(() => {
    const { showToast } = useToast();
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setSubmitting(true);
        const result = await subscribeToNewsletter(email);
        if (result.success) {
            showToast(result.message, 'success');
            setEmail('');
        } else {
            showToast(result.message, result.message.includes('already') ? 'info' : 'error');
        }
        setSubmitting(false);
    };

    return (
        <footer className="footer-master">
            <div className="footer-contact-section">
                <div className="container">
                    <h2 className="footer-section-title">Get In Touch</h2>
                    <div className="footer-title-bar"></div>
                    <p className="footer-contact-hint">Have questions? Reach out to us directly!</p>
                    <a href={createWhatsAppLink("Hello, I have a question.")} target="_blank" rel="noopener noreferrer" className="btn-chat-whatsapp" onClick={() => {
                        import('../../services/leads').then(({ trackWhatsAppClick }) =>
                            trackWhatsAppClick('footer')
                        ).catch(() => { /* best-effort */ });
                    }}>
                        Chat on WhatsApp
                    </a>
                    <p className="footer-email-hint">or email us at: <a href="mailto:wularsports@gmail.com">wularsports@gmail.com</a></p>
                </div>
            </div>

            <div className="footer-subscribe-section">
                <div className="container">
                    <h3 className="subscribe-title">SUBSCRIBE TO OUR EMAILS</h3>
                    <form className="footer-pill-form" onSubmit={handleSubscribe}>
                        <div className="pill-input-wrapper">
                            <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={submitting} />
                            <button type="submit" className="pill-submit-btn" disabled={submitting} aria-label="Subscribe">
                                <Icon name={submitting ? 'fa-spinner' : 'fa-arrow-right'} spin={submitting} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="footer-divider"></div>

            <div className="footer-bottom-bar">
                <div className="container container-flex">
                    <div className="footer-legal">
                    <div className="footer-seo-links" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <Link href="/hard-tennis-bats" className="legal-link">Hard Tennis Bats</Link>
                        <Link href="/soft-tennis-bats" className="legal-link">Soft Tennis Bats</Link>
                        <Link href="/leather-cricket-bats" className="legal-link">Leather Cricket Bats</Link>
                        <Link href="/about" className="legal-link">About Us</Link>
                        <Link href="/blog" className="legal-link">Wular Insights</Link>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                        <Link href="/privacy-policy" className="legal-link">Privacy Policy</Link>
                        <Link href="/return-policy" className="legal-link">Return Policy</Link>
                        <Link href="/terms-conditions" className="legal-link">Terms &amp; Conditions</Link>
                    </div>
                        <span className="copyright">© 2026 WULAR SPORTS</span>
                    </div>
                    <div className="footer-social-group">
                        <a href={INSTAGRAM_LINK} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Icon name="fa-instagram" /></a>
                        <a href={YOUTUBE_LINK} target="_blank" rel="noopener noreferrer" aria-label="YouTube"><Icon name="fa-youtube" /></a>
                    </div>
                </div>
            </div>
        </footer>
    );
});

Footer.displayName = 'Footer';
