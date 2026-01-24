import { FC, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { products } from '../../data/products';

export interface VideoModalProps {
    videoUrl: string | null;
    productId?: string | null;
    onClose: () => void;
}

export const VideoModal: FC<VideoModalProps> = ({ videoUrl, productId, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const navigate = useNavigate();

    const handleClose = () => {
        if (videoRef.current) {
            videoRef.current.pause();
        }
        onClose();
    };

    if (!videoUrl) return null;

    const product = productId ? products.find(p => p.id === productId) : null;

    return (
        <div className="video-modal-overlay" onClick={handleClose}>
            <button className="video-modal-close-btn" aria-label="Close video player" onClick={handleClose}>
                <i className="fas fa-times"></i>
            </button>
            <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
                <video ref={videoRef} src={videoUrl} controls preload="metadata" className="video-modal-player" autoPlay></video>

                {product && (
                    <div className="modal-product-footer" style={{
                        background: 'rgba(20, 20, 20, 0.95)',
                        borderTop: '2px solid var(--golden)',
                        padding: '1.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        borderBottomLeftRadius: '10px',
                        borderBottomRightRadius: '10px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <img
                                src={Array.isArray(product.image) ? product.image[0] : product.image}
                                alt={product.name}
                                style={{ width: '50px', height: '50px', objectFit: 'contain', background: '#fff', borderRadius: '5px' }}
                            />
                            <div>
                                <h4 style={{ color: 'var(--golden)', fontSize: '1rem', marginBottom: '2px' }}>{product.name}</h4>
                                <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 'bold' }}>₹{product.price.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                        <button
                            className="btn"
                            onClick={() => {
                                handleClose();
                                navigate(`/product/${product.id}`);
                            }}
                            style={{
                                padding: '0.6rem 1.5rem',
                                fontSize: '0.9rem',
                                boxShadow: '0 0 15px rgba(212, 175, 55, 0.3)'
                            }}
                        >
                            Shop This Bat
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
