import { FC, useState, useRef, useEffect } from 'react';

export interface VerticalImageGalleryProps {
    images: string[];
    altText: string;
    onImageClick: (index: number) => void;
    onScrollComplete?: () => void;
    scrollProgress?: number;
    onScrollContainerRef?: (ref: HTMLDivElement | null) => void;
}

export const VerticalImageGallery: FC<VerticalImageGalleryProps> = ({ 
    images, 
    altText, 
    onImageClick,
    onScrollComplete,
    scrollProgress = 0,
    onScrollContainerRef
}) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const imageItemsRef = useRef<(HTMLDivElement | null)[]>([]);

    // Expose scroll container ref to parent
    useEffect(() => {
        if (onScrollContainerRef && scrollContainerRef.current) {
            onScrollContainerRef(scrollContainerRef.current);
        }
    }, [onScrollContainerRef]);

    useEffect(() => {
        if (scrollContainerRef.current && scrollProgress >= 0 && scrollProgress <= 1) {
            const container = scrollContainerRef.current;
            const maxScroll = container.scrollHeight - container.clientHeight;
            const targetScroll = maxScroll * scrollProgress;
            container.scrollTop = targetScroll;
        }
    }, [scrollProgress]);

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;

        const container = scrollContainerRef.current;
        const scrollTop = container.scrollTop;
        const maxScroll = container.scrollHeight - container.clientHeight;
        const scrollPercentage = maxScroll > 0 ? scrollTop / maxScroll : 0;

        // Determine which image is in view
        imageItemsRef.current.forEach((item, index) => {
            if (item) {
                const rect = item.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                if (rect.top <= containerRect.top + containerRect.height / 2 && 
                    rect.bottom >= containerRect.top + containerRect.height / 2) {
                    setSelectedIndex(index);
                }
            }
        });

        // Check if scrolling is complete
        if (scrollPercentage >= 0.99 && onScrollComplete) {
            onScrollComplete();
        }
    };

    return (
        <div className="vertical-image-gallery">
            <div 
                ref={scrollContainerRef}
                className="vertical-gallery-scroll-container"
                onScroll={handleScroll}
            >
                {images.map((src, index) => (
                    <div 
                        key={`${src}-${index}`} 
                        ref={(el) => { imageItemsRef.current[index] = el; }}
                        className={`vertical-gallery-image-item ${selectedIndex === index ? 'selected' : ''}`}
                        onClick={() => {
                            setSelectedIndex(index);
                            onImageClick(index);
                            // Scroll to image
                            if (scrollContainerRef.current && imageItemsRef.current[index]) {
                                imageItemsRef.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }}
                    >
                        <img 
                            src={src} 
                            alt={`${altText} - View ${index + 1}`} 
                            className="vertical-gallery-image"
                            loading={index === 0 ? "eager" : "lazy"}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
