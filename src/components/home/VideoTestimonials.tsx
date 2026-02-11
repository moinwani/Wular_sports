import { FC, useState } from 'react';
import { VideoModal } from '../common/VideoModal';
import { products } from '../../data/products';
import { Testimonial } from '../../types';

const testimonials: Testimonial[] = [
    {
        id: 1,
        url: 'https://www.youtube.com/shorts/rOqK2kZQzTI',
        name: 'Arjun P.',
        comment: 'Super fast 4-day delivery (expected 8 days)! The balance and ping with the 130-140g heavy tennis ball are absolutely incredible.',
        rating: 5,
        productId: 'legacy-edition',
        isRepeatCustomer: true
    },
    {
        id: 2,
        url: 'https://www.youtube.com/shorts/APmTiKN8dG8',
        name: 'Prashant M.',
        comment: 'Absolutely love the bat! Exactly what was shown online was delivered. Kashmiri willow at its finest!',
        rating: 5,
        productId: 'legacy-edition-2.0'
    },
    {
        id: 3,
        url: 'https://www.youtube.com/shorts/rf8CkJKKfsg',
        name: 'Omkar P.',
        comment: 'Absolutely love the wood quality and the perfect shape and balance of the bat. It even has a beautiful curve! Everything shown was provided, including the bat cover and extra grip.',
        rating: 5,
        productId: 'legacy-edition'
    },
    {
        id: 4,
        url: 'https://www.youtube.com/shorts/GABV4WB2NBU',
        name: 'Shalinder',
        comment: "As a professional tournament player, I've used bats from many companies, but the quality of this Legacy Edition is unmatched. The shape, balance, and ping are exceptional. It's tournament-ready and I love playing with it!",
        rating: 5,
        productId: 'legacy-edition'
    },
    {
        id: 5,
        url: 'https://www.youtube.com/shorts/dJ3IaZCmPJQ',
        name: 'Karthik R.',
        comment: 'Excellent customer service and top-notch quality bats.',
        rating: 5,
        productId: 'legacy-edition'
    },
    {
        id: 6,
        url: 'https://www.youtube.com/shorts/Xo_ncNgEgjc',
        name: 'Shadh Hussain',
        comment: "Absolutely incredible wood quality. I didn't expect this much excellence—this truly feels like A+ grade Kashmiri willow. Everything from the grain to the finish is top-notch.",
        rating: 5,
        productId: 'legacy-edition'
    },
    {
        id: 7,
        url: 'https://www.youtube.com/shorts/tUGmUsV5azM',
        name: 'Romman',
        comment: 'The Bahubali Edition is a beast! The power in this bat is incredible, yet the balance makes it feel so light in the hands. Truly a game-changer for heavy tennis ball cricket.',
        rating: 5,
        productId: 'bahubali-edition'
    },
    {
        id: 8,
        url: 'https://youtube.com/shorts/51_M34PKL_I',
        name: 'Arjun P.',
        comment: 'Repeat customer! This time I got the AK-47 Edition (Honeycomb Scoop). The lightweight design and precision engineering make it a beast on the field.',
        rating: 5,
        productId: 'ak-47-honeycomb',
        isRepeatCustomer: true
    }
];

export const VideoTestimonials: FC = () => {
    const [isReelOpen, setIsReelOpen] = useState(false);
    const [startIndex, setStartIndex] = useState(0);

    const openReel = (index: number) => {
        setStartIndex(index);
        setIsReelOpen(true);
    };

    const getYouTubeId = (url: string) => {
        if (url.includes('/shorts/')) {
            return url.split('/shorts/')[1].split(/[?#]/)[0];
        }
        return url.split('v=')[1]?.split('&')[0] || url.split('/').pop()?.split('?')[0];
    };

    return (
        <section className="video-testimonials" style={{ background: '#0a0a0a' }}>
            <div className="container">
                <h2 className="section-title">Champion Reviews</h2>
                <p className="section-subtitle">Real feedback from real players across the country</p>

                <div className="testimonials-grid premium-feed">
                    {testimonials.map((t, idx) => {
                        const product = products.find(p => p.id === t.productId);
                        const videoId = getYouTubeId(t.url);

                        return (
                            <div
                                key={t.id}
                                className="testimonial-card premium-vertical-card"
                                onClick={() => openReel(idx)}
                            >
                                <div className="video-container vertical-reel">
                                    {videoId ? (
                                        <div className="testimonial-youtube-preview">
                                            <iframe
                                                src={`https://www.youtube.com/embed/${videoId}?mute=1&autoplay=1&controls=0&loop=1&playlist=${videoId}&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&origin=${window.location.origin}&widgetid=1`}
                                                title={`Testimonial ${t.id}`}
                                                frameBorder="0"
                                                allow="autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                referrerPolicy="no-referrer-when-downgrade"
                                                className="testimonial-iframe-preview"
                                            ></iframe>
                                            <div className="iframe-click-overlay"></div>
                                        </div>
                                    ) : (
                                        <video
                                            src={t.url}
                                            controls={false}
                                            muted
                                            playsInline
                                            autoPlay
                                            loop
                                            className="testimonial-video"
                                        />
                                    )}

                                    {/* Premium Overlay Info */}
                                    <div className="testimonial-premium-overlay">
                                        <div className="overlay-content">
                                            <div className="name-row">
                                                <h4 className="customer-name-overlay">{t.name}</h4>
                                                {t.isRepeatCustomer && (
                                                    <span className="repeat-badge">
                                                        <i className="fas fa-redo-alt"></i> Repeat Champion
                                                    </span>
                                                )}
                                            </div>
                                            {product && (
                                                <div className="bat-shown-overlay">
                                                    <span className="label">BAT SHOWN:</span>
                                                    <div className="product-price-row">
                                                        <span className="name">{product.name}</span>
                                                        <span className="price">₹{product.price.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {
                isReelOpen && (
                    <VideoModal
                        testimonials={testimonials}
                        initialIndex={startIndex}
                        onClose={() => setIsReelOpen(false)}
                    />
                )
            }
        </section >
    );
};
