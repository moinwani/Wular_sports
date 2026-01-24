import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoModal } from '../common/VideoModal';
import { products } from '../../data/products';

const testimonials = [
    {
        id: 1,
        url: 'https://res.cloudinary.com/ddahm5ebv/video/upload/v1768968198/IMG_8104_qcdcfi.mp4',
        name: 'Arjun P.',
        comment: 'The balance and ping of Wular bats are exceptional. Truly handcrafted for champions.',
        rating: 5,
        productId: 'legacy-edition-2.0'
    },
    {
        id: 2,
        url: 'https://res.cloudinary.com/ddahm5ebv/video/upload/v1768968188/IMG_8110_kuipvj.mp4',
        name: 'Zaid K.',
        comment: 'Fast shipping and even better quality. Kashmiri willow at its finest!',
        rating: 5,
        productId: 'legacy-edition'
    },
    {
        id: 3,
        url: 'https://res.cloudinary.com/ddahm5ebv/video/upload/v1768968188/IMG_7408_rrroyv.mp4',
        name: 'Rahul M.',
        comment: 'Wular Sports never disappoints. The customization options are a game changer.',
        rating: 5,
        productId: 'legacy-edition'
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

    return (
        <section className="video-testimonials" style={{ background: '#0a0a0a' }}>
            <div className="container">
                <h2 className="section-title">Champion Reviews</h2>
                <p className="section-subtitle">Real feedback from real players across the country</p>

                <div className="testimonials-grid">
                    {testimonials.map((t, idx) => {
                        const product = products.find(p => p.id === t.productId);

                        return (
                            <div
                                key={t.id}
                                className="testimonial-card"
                                onClick={() => openReel(idx)}
                                style={{ display: 'flex', flexDirection: 'column' }}
                            >
                                <div className="video-container">
                                    <video
                                        src={t.url}
                                        controls={false}
                                        muted
                                        playsInline
                                        autoPlay
                                        loop
                                        className="testimonial-video"
                                    />
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
