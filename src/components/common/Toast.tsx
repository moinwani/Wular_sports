import React, { FC } from 'react';

export interface ToastProps {
    message: string;
    isVisible: boolean;
}

export const Toast: FC<ToastProps> = ({ message, isVisible }) => {
    return <div className={`toast ${isVisible ? 'show' : ''}`}>{message}</div>;
};
