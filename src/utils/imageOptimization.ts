/**
 * Optimizes Cloudinary image URLs with transformations
 * @param url - Original Cloudinary URL
 * @param width - Desired width in pixels
 * @param quality - Image quality (1-100), default 80
 * @returns Optimized URL with transformations
 */
export const optimizeCloudinaryImage = (
    url: string,
    width?: number,
    quality: number = 80
): string => {
    if (!url.includes('cloudinary.com')) {
        return url;
    }

    // Extract the upload part and insert transformations
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return url;

    const transformations: string[] = [];

    if (width) {
        transformations.push(`w_${width}`);
    }

    transformations.push(`q_${quality}`);
    transformations.push('f_auto'); // Auto format (WebP when supported)
    transformations.push('c_scale'); // Scale to fit width

    const transformString = transformations.join(',');

    return url.slice(0, uploadIndex + 8) + transformString + '/' + url.slice(uploadIndex + 8);
};

/**
 * Get responsive image sizes for different breakpoints
 */
export const getResponsiveImageUrl = (url: string, size: 'thumbnail' | 'card' | 'detail' | 'hero'): string => {
    const sizeMap = {
        thumbnail: 150,
        card: 400,
        detail: 800,
        hero: 1200
    };

    return optimizeCloudinaryImage(url, sizeMap[size]);
};
