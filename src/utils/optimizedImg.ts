import { getImageProps } from 'next/image';
import { getCDNUrl } from '../services/githubService';

/**
 * A resized, cached copy of a product photo for a plain <img> — spread the
 * result onto the element; its own CSS keeps deciding the size. `sizes` is how
 * wide it shows (e.g. "80px", "100vw") so the phone downloads a fitting size
 * instead of the multi-MB original.
 */
export const optimizedImg = (src: string, sizes: string): { src: string; srcSet?: string; sizes?: string } => {
    if (!src) return { src };
    const { props } = getImageProps({ src: getCDNUrl(src), alt: '', width: 2048, height: 2048, sizes });
    return { src: props.src, srcSet: props.srcSet, sizes: props.sizes };
};
