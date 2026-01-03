import { FC, useState, useRef, TouchEvent } from 'react';

export interface HorizontalImageGalleryProps {
    images: string[];
    altText: string;
    onImageClick: (index: number) => void;
}

export const HorizontalImageGallery: FC<HorizontalImageGalleryProps> = ({ images, altText, onImageClick }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    const handleTouchStart = (e: TouchEvent) => {
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
                            <img 
                                src={src} 
                                alt={`${altText} - View ${index + 1}`} 
                                className="horizontal-gallery-image"
                                loading={index === 0 ? "eager" : "lazy"}
                            />
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
                        onClick={() => setCurrentIndex(index)}
                        aria-label={`View image ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

