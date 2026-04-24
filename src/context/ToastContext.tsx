import { createContext, useContext, useState, ReactNode } from 'react';

interface ToastState {
    message: string;
    type: 'success' | 'error' | 'info';
}

interface ToastContextType {
    toast: ToastState | null;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    clearToast: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toast, setToast] = useState<ToastState | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    return (
        <ToastContext.Provider value={{ toast, showToast, clearToast: () => setToast(null) }}>
            {children}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be inside ToastProvider');
    return ctx;
}
