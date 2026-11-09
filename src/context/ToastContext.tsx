import { createContext, useContext, useRef, useState, ReactNode } from 'react';

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
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type });
        // A new message gets its full 3 seconds (the previous one's timer used to cut it short)
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setToast(null), 3000);
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
