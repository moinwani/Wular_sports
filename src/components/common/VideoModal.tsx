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

    const togglePlay = () => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
            } else {
                videoRef.current.pause();
            }
        }
    };

    return (
        <div className="video-modal-overlay" onClick={handleClose}>
            <button className="video-modal-close-btn" aria-label="Close video player" onClick={handleClose}>
                <i className="fas fa-times"></i>
            </button>
            <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
                <video
                    ref={videoRef}
                    src={videoUrl}
                    preload="metadata"
                    className="video-modal-player"
                    autoPlay
                    playsInline
                    webkit-playsinline="true"
                    onClick={togglePlay}
                    style={{ cursor: 'pointer' }}
                ></video>

                {/* Visual Play Hint Overlay (Optional but helpful since controls are gone) */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    opacity: 0, // Keep it subtle or hidden until needed
                    fontSize: '3rem',
                    color: 'rgba(255,255,255,0.5)'
                }}>
                    <i className="fas fa-play"></i>
                </div>

                {product && (
                    <div className="modal-product-footer" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-product-info">
                            <img
                                src={Array.isArray(product.image) ? product.image[0] : product.image}
                                alt={product.name}
                                className="modal-product-img"
                            />
                            <div className="modal-product-details">
                                <h4>{product.name}</h4>
                                <span className="modal-product-price">₹{product.price.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                        <button
                            className="btn"
                            onClick={() => {
                                handleClose();
                                navigate(`/product/${product.id}`);
                            }}
                            style={{
                                boxShadow: '0 0 15px rgba(212, 175, 55, 0.3)'
                            }}
                        >
                            Shop Now
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
