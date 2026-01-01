import { FC, useState, useRef, useMemo, useEffect, useCallback, TouchEvent, MouseEvent } from 'react';

export interface LightboxProps {
    gallery: {
        images: string[];
        startIndex: number;
    } | null;
    onClose: () => void;
}

export const Lightbox: FC<LightboxProps> = ({ gallery, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);
    const interactionStartRef = useRef(0);
    const wasDraggedRef = useRef(false);

    const images = useMemo(() => gallery?.images ?? [], [gallery]);

    const goToPrev = useCallback(() => {
        if (isZoomed) return;
        setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
        setIsZoomed(false); // Unzoom when changing image
    }, [isZoomed, images.length]);

    const goToNext = useCallback(() => {
        if (isZoomed) return;
        setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
        setIsZoomed(false); // Unzoom when changing image
    }, [isZoomed, images.length]);

    useEffect(() => {
        if (gallery) {
            setCurrentIndex(gallery.startIndex);
            setIsZoomed(false);
        }
    }, [gallery]);

    useEffect(() => {
        if (!gallery) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') goToNext();
            if (e.key === 'ArrowLeft') goToPrev();
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [gallery, goToNext, goToPrev, onClose]);

    if (!gallery) return null;

    const handleTouchStart = (e: TouchEvent) => {
        if (isZoomed) return;
        interactionStartRef.current = e.targetTouches[0].clientX;
        wasDraggedRef.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (isZoomed) return;
        if (Math.abs(interactionStartRef.current - e.targetTouches[0].clientX) > 10) {
            e.preventDefault();
            wasDraggedRef.current = true;
        }
    };

    const handleTouchEnd = (e: TouchEvent) => {
        if (isZoomed) return;
        const delta = interactionStartRef.current - e.changedTouches[0].clientX;
        if (delta > 50) goToNext();
        else if (delta < -50) goToPrev();
    };

    const handleImageClick = () => {
        if (!wasDraggedRef.current) {
            setIsZoomed(!isZoomed);
        }
    };

    const handleCloseClick = (e: MouseEvent) => {
        e.stopPropagation();
        onClose();
    };

    return (
        <div className="lightbox-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="lightbox-counter">
            <button className="lightbox-close-btn" aria-label="Close image gallery" onClick={handleCloseClick}>
                <i className="fas fa-times"></i>
            </button>

            <div className="lightbox-content-container">
                {images.length > 1 && (
                    <>
                        <button onClick={(e) => { e.stopPropagation(); goToPrev(); }} className="lightbox-nav-btn prev" aria-label="Previous image" disabled={isZoomed}><i className="fas fa-chevron-left"></i></button>
                        <button onClick={(e) => { e.stopPropagation(); goToNext(); }} className="lightbox-nav-btn next" aria-label="Next image" disabled={isZoomed}><i className="fas fa-chevron-right"></i></button>
                    </>
                )}

                <div
                    className="lightbox-content"
                    onClick={e => e.stopPropagation()}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="lightbox-filmstrip" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                        {images.map((src, index) => (
                            <div key={src} className="lightbox-image-wrapper">
                                <img
                                    src={src}
                                    alt={`Full screen product view ${index + 1} of ${images.length}`}
                                    className={`lightbox-image ${isZoomed ? 'zoomed' : ''}`}
                                    onClick={handleImageClick}
                                    draggable="false"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {images.length > 1 && (
                <div className="lightbox-footer">
                    <span id="lightbox-counter" className="lightbox-counter">{currentIndex + 1} / {images.length}</span>
                </div>
            )}
        </div>
    );
};
