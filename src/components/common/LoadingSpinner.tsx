import { FC } from 'react';

interface LoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    fullScreen?: boolean;
}

export const LoadingSpinner: FC<LoadingSpinnerProps> = ({
    size = 'medium',
    fullScreen = false
}) => {
    const sizeClasses = {
        small: 'spinner-small',
        medium: 'spinner-medium',
        large: 'spinner-large'
    };

    const spinner = (
        <div className={`spinner ${sizeClasses[size]}`}>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
        </div>
    );

    if (fullScreen) {
        return (
            <div className="loading-overlay">
                {spinner}
            </div>
        );
    }

    return spinner;
};
