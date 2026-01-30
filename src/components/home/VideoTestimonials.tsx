import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoModal } from '../common/VideoModal';
import { products } from '../../data/products';

const testimonials = [
    {
        id: 1,
        url: 'https://www.youtube.com/shorts/rOqK2kZQzTI',
        name: 'Arjun P.',
        comment: 'The balance and ping of Wular bats are exceptional. Truly handcrafted for champions.',
        rating: 5,
        productId: 'legacy-edition-2.0'
    },
    {
        id: 2,
        url: 'https://www.youtube.com/shorts/APmTiKN8dG8',
        name: 'Zaid K.',
        comment: 'Fast shipping and even better quality. Kashmiri willow at its finest!',
        rating: 5,
        productId: 'legacy-edition'
    },
    {
        id: 3,
        url: 'https://www.youtube.com/shorts/rf8CkJKKfsg',
        name: 'Rahul M.',
        comment: 'Wular Sports never disappoints. The customization options are a game changer.',
        rating: 5,
        productId: 'bahubali-edition'
    },
    {
        id: 4,
        url: 'https://www.youtube.com/shorts/GABV4WB2NBU',
        name: 'Irfan S.',
        comment: 'The best Kashmiri willow I have ever played with. Highly recommended!',
        rating: 5,
        productId: 'ak-47-edition'
    },
    {
        id: 5,
        url: 'https://www.youtube.com/shorts/dJ3IaZCmPJQ',
        name: 'Sameer A.',
        comment: 'Excellent customer service and top-notch quality bats.',
        rating: 5,
        productId: 'ak-47-honeycomb'
    },
    {
        id: 6,
        url: 'https://www.youtube.com/shorts/Xo_ncNgEgjc',
        name: 'Vikram R.',
        comment: 'Amazing ping and light weight. Perfect for professional matches.',
        rating: 5,
        productId: 'standard-leather-bat'
    }
];

export const VideoTestimonials: FC = () => {
    const navigate = useNavigate();
    const [isReelOpen, setIsReelOpen] = useState(false);
    const [startIndex, setStartIndex] = useState(0);

    const openReel = (index: number) => {
        setStartIndex(index);
        setIsReelOpen(true);
    };

    const handleShopClick = (e: React.MouseEvent, productId: string) => {
        e.stopPropagation(); // Prevent opening reel
        navigate(`/product/${productId}`);
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

                <div className="testimonials-grid">
                    {testimonials.map((t, idx) => {
                        const product = products.find(p => p.id === t.productId);
                        const videoId = getYouTubeId(t.url);

                        return (
                            <div
                                key={t.id}
                                className="testimonial-card"
                                onClick={() => openReel(idx)}
                                style={{ display: 'flex', flexDirection: 'column' }}
                            >
                                <div className="video-container">
                                    {videoId ? (
                                        <div
                                            className="youtube-thumbnail"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                backgroundImage: `url(https://img.youtube.com/vi/${videoId}/maxresdefault.jpg), url(https://img.youtube.com/vi/${videoId}/hqdefault.jpg)`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center'
                                            }}
                                        />
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
                                    <div className="play-overlay">
                                        <i className="fas fa-play"></i>
                                    </div>
                                </div>
                                <div className="testimonial-info" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div className="rating">
                                        {[...Array(t.rating)].map((_, i) => (
                                            <i key={i} className="fas fa-star"></i>
                                        ))}
                                    </div>
                                    <p className="comment">"{t.comment}"</p>
                                    <h4 className="customer-name">{t.name}</h4>

                                    {/* Product Purchase Link Section */}
                                    {product && (
                                        <div className="testimonial-product-link">
                                            <div style={{ textAlign: 'left' }}>
                                                <span style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>Bat Shown:</span>
                                                <span style={{ fontSize: '0.9rem', color: 'var(--white)', fontWeight: 'bold' }}>{product.name}</span>
                                            </div>
                                            <button
                                                className="btn"
                                                onClick={(e) => handleShopClick(e, product.id)}
                                                style={{
                                                    padding: '0.4rem 1rem',
                                                    fontSize: '0.8rem',
                                                    background: 'transparent',
                                                    border: '1px solid var(--golden)',
                                                    color: 'var(--golden)'
                                                }}
                                            >
                                                Shop This Bat
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {isReelOpen && (
                <VideoModal
                    testimonials={testimonials}
                    initialIndex={startIndex}
                    onClose={() => setIsReelOpen(false)}
                />
            )}
        </section>
    );
};
