import { FC } from 'react';

export interface ToastProps {
    message: string;
    isVisible: boolean;
    type?: 'success' | 'error' | 'info';
    onClose?: () => void;
}

export const Toast: FC<ToastProps> = ({ message, isVisible, type, onClose }) => {
    return (
        <div className={`toast ${isVisible ? 'show' : ''} ${type || ''}`} role="status" aria-live="polite">
            <span>{message}</span>
            {onClose && (
                <button className="toast-close-btn" onClick={onClose} aria-label="Close notification">
                    &times;
                </button>
            )}
        </div>
    );
};
