import React, { FC } from 'react';

export interface ToastProps {
    message: string;
    isVisible: boolean;
    type?: 'success' | 'error' | 'info';
    onClose?: () => void;
}

export const Toast: FC<ToastProps> = ({ message, isVisible, type }) => {
    return <div className={`toast ${isVisible ? 'show' : ''} ${type || ''}`}>{message}</div>;
};
