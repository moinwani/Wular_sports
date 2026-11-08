import { FC, useState, useRef, useEffect, TouchEvent } from 'react';
import Image from 'next/image';

export interface HorizontalImageGalleryProps {
    images: string[];
    altText: string;
    onImageClick: (index: number) => void;
}

export const HorizontalImageGallery: FC<HorizontalImageGalleryProps> = ({ images, altText, onImageClick }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);
    // Photos 2+ load once the page has finished loading (or as soon as the
    // shopper starts swiping), so the first photo gets the whole connection.
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        const show = () => setShowAll(true);
        if (document.readyState === 'complete') { show(); return; }
        window.addEventListener('load', show, { once: true });
        return () => window.removeEventListener('load', show);
    }, []);

    const handleTouchStart = (e: TouchEvent) => {
        setShowAll(true);
        touchStartX.current = e.targetTouches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
        touchEndX.current = e.targetTouches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return;
        
        const distance = touchStartX.current - touchEndX.current;
        const minSwipeDistance = 50;

        if (distance > minSwipeDistance) {
            // Swipe left - next image
            setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
        } else if (distance < -minSwipeDistance) {
            // Swipe right - previous image
            setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
        }
    };

    return (
        <div className="horizontal-image-gallery-mobile">
            <div 
                className="horizontal-gallery-container"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div 
                    className="horizontal-gallery-slider"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {images.map((src, index) => (
                        <div 
                            key={`${src}-${index}`}
                            className="horizontal-gallery-slide"
                            onClick={() => onImageClick(index)}
                        >
                            {(index === 0 || showAll) && <Image 
                                src={src} 
                                alt={`${altText} - View ${index + 1}`} 
                                className="horizontal-gallery-image"
                                width={800}
                                height={800}
                                sizes="(max-width: 768px) 100vw, 600px"
                                priority={index === 0}
                                loading={index === 0 ? undefined : "lazy"}
                            />}
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Image Indicators */}
            <div className="horizontal-gallery-indicators">
                {images.map((_, index) => (
                    <button
                        key={index}
                        className={`gallery-indicator ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => { setShowAll(true); setCurrentIndex(index); }}
                        aria-label={`View image ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

