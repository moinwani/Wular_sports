import { FC, useState, useRef, TouchEvent, MouseEvent } from 'react';

export interface ImageGalleryProps {
    images: string[];
    altText: string;
    onImageClick: (index: number) => void;
}

export const ImageGallery: FC<ImageGalleryProps> = ({ images, altText, onImageClick }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const interactionStartRef = useRef(0);
    const wasDraggedRef = useRef(false);
    const [isDragging, setIsDragging] = useState(false);
    const interactionStartRef = useRef(0);
    const wasDraggedRef = useRef(false);
    const filmstripRef = useRef<HTMLDivElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setCurrentIndex(index);
        }
    };

    const goToPrev = () => setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
    const goToNext = () => setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));

    // Touch handlers
    const handleTouchStart = (e: TouchEvent) => {
        interactionStartRef.current = e.targetTouches[0].clientX;
        wasDraggedRef.current = false;
    };
    const handleTouchMove = (e: TouchEvent) => {
        if (Math.abs(interactionStartRef.current - e.targetTouches[0].clientX) > 10) {
            e.preventDefault();
            wasDraggedRef.current = true;
        }
    };
    const handleTouchEnd = (e: TouchEvent) => {
        const delta = interactionStartRef.current - e.changedTouches[0].clientX;
        if (delta > 50) goToNext();
        else if (delta < -50) goToPrev();
    };

    // Mouse handlers
    const handleMouseDown = (e: MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        wasDraggedRef.current = false;
        interactionStartRef.current = e.clientX;
        if (filmstripRef.current) {
            filmstripRef.current.style.cursor = 'grabbing';
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        if (Math.abs(interactionStartRef.current - e.clientX) > 10) {
            wasDraggedRef.current = true;
        }
    };

    const handleMouseUp = (e: MouseEvent) => {
        if (!isDragging) return;
        setIsDragging(false);
        if (filmstripRef.current) {
            filmstripRef.current.style.cursor = 'pointer';
        }
        const delta = interactionStartRef.current - e.clientX;
        if (delta > 50) goToNext();
        else if (delta < -50) goToPrev();
    };

    const handleMouseLeave = (e: MouseEvent) => {
        if (isDragging) {
            handleMouseUp(e);
        }
    };

    const handleImageWrapperClick = (index: number) => {
        if (!wasDraggedRef.current) {
            onImageClick(index);
        }
    };

    return (
        <div className="image-gallery">
            <div className="gallery-main-container">
                <div
                    ref={filmstripRef}
                    className="gallery-filmstrip"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                    onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
                    onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
                >
                    {images.map((src, index) => (
                        <div key={src} className="gallery-image-wrapper" onClick={() => handleImageWrapperClick(index)}>
                            <img src={src} alt={altText} className="gallery-main-image" loading="lazy" draggable="false" />
                        </div>
                    ))}
                </div>
                <button onClick={goToPrev} className="gallery-nav-btn prev" aria-label="Previous image"><i className="fas fa-chevron-left"></i></button>
                <button onClick={goToNext} className="gallery-nav-btn next" aria-label="Next image"><i className="fas fa-chevron-right"></i></button>
            </div>
            <div className="gallery-thumbnails">
                {images.map((src, index) => (
                    <img
                        key={src}
                        src={src}
                        alt={`View product view ${index + 1}`}
                        className={`gallery-thumbnail ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => setCurrentIndex(index)}
                        loading="lazy"
                        tabIndex={0}
                        role="button"
                        onKeyDown={(e) => handleKeyDown(e, index)}
                    />
                ))}
            </div>
        </div>
    );
};
