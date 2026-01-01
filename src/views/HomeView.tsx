import { FC, useRef, RefObject } from 'react';
import { Hero } from '../components/home/Hero';
import { Catalog } from '../components/product/Catalog';
import { Customization } from '../components/checkout/Customization';
import { About } from '../components/home/About';
import { Contact } from '../components/home/Contact';
import { ProductFull } from '../types';

interface HomeViewProps {
    onShopCollectionClick: () => void;
    onAddToCart: (product: ProductFull, size: string | null) => void;
    onImageClick: (images: string[], startIndex: number) => void;
    onWatchVideo: (url: string, ref: RefObject<HTMLButtonElement>) => void;
}

export const HomeView: FC<HomeViewProps> = ({ onShopCollectionClick, onAddToCart, onImageClick, onWatchVideo }) => {
    const catalogRef = useRef<HTMLElement>(null);
    return (
        <main>
            <Hero onShopCollectionClick={onShopCollectionClick} />
            <Catalog ref={catalogRef} onAddToCart={onAddToCart} onImageClick={onImageClick} onWatchVideo={onWatchVideo} />
            <Customization />
            <About />
            <Contact />
        </main>
    );
};
