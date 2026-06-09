import { FC } from 'react';
import { SEOHead } from '../components/common/SEOHead';
import { Icon } from '../components/common/Icon';

const structuredData = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "About Wular Sports",
    "url": "https://wularsports.com/about",
    "description": "Learn about Wular Sports — a Kashmiri willow cricket bat manufacturer based in Srinagar, Kashmir. Handcrafted hard tennis, soft tennis, and leather ball bats for cricketers across India.",
    "mainEntity": {
        "@type": "Organization",
        "name": "Wular Sports",
        "foundingLocation": {
            "@type": "Place",
            "name": "Srinagar, Jammu and Kashmir, India"
        },
        "description": "Premium handcrafted Kashmiri willow cricket bat manufacturer based in Srinagar, Kashmir. Specialising in hard tennis, soft tennis, and leather ball bats for cricketers across India.",
        "url": "https://wularsports.com",
        "sameAs": [
            "https://www.instagram.com/wular.sports",
            "https://youtube.com/@wularsports"
        ]
    }
};

export const AboutView: FC = () => (
    <div className="view about-page">
        <SEOHead
            title="About Wular Sports | Kashmiri Willow Cricket Bat Makers from Srinagar"
            description="Wular Sports is a Kashmiri willow cricket bat manufacturer based in Srinagar, Kashmir. We handcraft hard tennis, soft tennis, and leather ball bats for cricketers across India. Learn our story."
            keywords="about Wular Sports, Kashmiri willow bat manufacturer, cricket bat makers Kashmir, Srinagar cricket bats, handcrafted cricket bats India"
            canonicalUrl="https://wularsports.com/about"
            structuredData={structuredData}
        />

        <div className="about-page-hero">
            <div className="container">
                <h1 className="about-page-title">About Wular Sports</h1>
                <p className="about-page-subtitle">Handcrafting Kashmiri Willow Cricket Bats from the Heart of Kashmir</p>
            </div>
        </div>

        <div className="container about-page-content">

            <section className="about-section">
                <h2>Who We Are</h2>
                <p>
                    Wular Sports is a cricket bat manufacturer based in <strong>Srinagar, Jammu and Kashmir, India</strong> — the heartland of Kashmiri willow craftsmanship. We design and handcraft premium cricket bats from Grade A and Grade A+ Kashmiri willow wood, built for every format of the game: hard tennis, soft tennis, tape ball, and professional leather ball cricket.
                </p>
                <p>
                    Every bat that leaves our workshop is a product of skilled hands, carefully selected willow, and an obsession with quality. We believe that every cricketer in India deserves a bat that performs at the highest level — without paying the premium of English willow. That is what Wular Sports was built to deliver.
                </p>
            </section>

            <section className="about-section">
                <h2>Why Kashmiri Willow?</h2>
                <p>
                    Kashmir Valley has been producing world-class cricket bat willow for decades. The cool Himalayan climate, clean water, and rich soil create willow with exceptional density, natural durability, and striking grain patterns — qualities that translate directly into bat performance and longevity.
                </p>
                <p>
                    Kashmiri willow is denser than English willow, making it naturally more resistant to cracking on Indian pitches — which are often abrasive, hard, or concrete. Our bats are naturally seasoned for <strong>1 to 3 years</strong> before crafting, which compresses the wood fibers and develops the hitting power the willow is capable of.
                </p>
                <p>
                    While English willow commands a price of ₹8,000 to ₹50,000+, premium Kashmiri willow bats from Wular Sports deliver comparable club-level performance at a fraction of the cost — making serious cricket accessible to every player.
                </p>
            </section>

            <section className="about-section">
                <h2>Our Craft</h2>
                <p>
                    Each Wular Sports bat goes through a rigorous manufacturing process:
                </p>
                <ul className="about-process-list">
                    <li>
                        <strong>Wood Selection:</strong> We hand-select every willow cleft for grain count, density, and absence of defects. Only Grade A and A+ willow makes the cut.
                    </li>
                    <li>
                        <strong>Natural Seasoning:</strong> Selected clefts are air-dried for 1–3 years in our Srinagar workshop. No artificial kiln drying — only time and mountain air.
                    </li>
                    <li>
                        <strong>Hard Pressing:</strong> For our hard tennis range, blades are machine-pressed to increase surface density and durability, creating the power-hitting surface the format demands.
                    </li>
                    <li>
                        <strong>Scoop Profiles:</strong> Our craftsmen shape scoop profiles — ramp scoop for premium hard tennis bats, honeycomb scoop for soft tennis bats — by hand for precise weight distribution.
                    </li>
                    <li>
                        <strong>Singapore Cane Handles:</strong> Every bat is fitted with a premium Singapore cane handle for natural vibration absorption and a responsive, comfortable feel.
                    </li>
                    <li>
                        <strong>Knocking & Oiling:</strong> Every bat ships fully knocked and oiled — ready for match play out of the box.
                    </li>
                </ul>
            </section>

            <section className="about-section">
                <h2>Our Range</h2>
                <p>We currently manufacture three categories of Kashmiri willow cricket bats:</p>
                <div className="about-categories">
                    <div className="about-category-card">
                        <h3>Hard Tennis Bats</h3>
                        <p>Built for tournament-level hard tennis ball cricket. Heavier, denser, hard-pressed Kashmiri willow with ramp scoop profiles and Singapore cane handles. Weights range from 980g to 1100g.</p>
                        <a href="/hard-tennis-bats" className="btn">Shop Hard Tennis Bats</a>
                    </div>
                    <div className="about-category-card">
                        <h3>Soft Tennis Bats</h3>
                        <p>Lightweight Kashmiri willow bats with honeycomb scoop designs for maximum bat speed. Weights range from 820g to 950g. Built for tape ball and soft tennis cricket.</p>
                        <a href="/soft-tennis-bats" className="btn">Shop Soft Tennis Bats</a>
                    </div>
                    <div className="about-category-card">
                        <h3>Leather Cricket Bats</h3>
                        <p>Grade A+ Kashmiri willow with 5–12 clear grains. Professional-grade leather ball bats built for club cricket, league matches, and serious practice.</p>
                        <a href="/leather-cricket-bats" className="btn">Shop Leather Bats</a>
                    </div>
                </div>
            </section>

            <section className="about-section">
                <h2>Customisation</h2>
                <p>
                    We offer full bat customisation for both tennis and leather ball formats. You can choose blade type, scoop profile, finish (polished, raw, burned), weight range, height, handle type, toe guard, sticker design, and bat bag. Every customised bat is handmade to order from our Srinagar workshop.
                </p>
                <p>
                    To place a custom order, visit the customisation section on our homepage or reach out to us directly on WhatsApp.
                </p>
            </section>

            <section className="about-section about-contact-section">
                <h2>Get In Touch</h2>
                <p>We are based in <strong>Srinagar, Jammu and Kashmir, India</strong> and deliver free across India.</p>
                <div className="about-contact-grid">
                    <div className="about-contact-item">
                        <Icon name="fa-whatsapp" />
                        <div>
                        <strong>WhatsApp</strong>
                        <a href="https://wa.me/919320622451" target="_blank" rel="noopener noreferrer" onClick={() => {
                            window.dataLayer.push({ event: 'whatsapp_click', source: 'about_page', type: 'general_contact' });
                        }}>+91 93206 22451</a>
                        </div>
                    </div>
                    <div className="about-contact-item">
                        <Icon name="fa-envelope" />
                        <div>
                            <strong>Email</strong>
                            <a href="mailto:wularsports@gmail.com">wularsports@gmail.com</a>
                        </div>
                    </div>
                    <div className="about-contact-item">
                        <Icon name="fa-instagram" />
                        <div>
                            <strong>Instagram</strong>
                            <a href="https://www.instagram.com/wular.sports" target="_blank" rel="noopener noreferrer">@wular.sports</a>
                        </div>
                    </div>
                    <div className="about-contact-item">
                        <Icon name="fa-youtube" />
                        <div>
                            <strong>YouTube</strong>
                            <a href="https://youtube.com/@wularsports" target="_blank" rel="noopener noreferrer">@wularsports</a>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    </div>
);
