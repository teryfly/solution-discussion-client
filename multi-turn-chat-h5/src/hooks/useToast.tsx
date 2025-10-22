import { useState, useCallback } from 'react';
import { Toast } from '../components/common/Toast';
import { createRoot } from 'react-dom/client';

interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export const useToast = () => {
  const showToast = useCallback((options: ToastOptions) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    const handleClose = () => {
      root.unmount();
      document.body.removeChild(container);
    };

    root.render(
      <Toast
        message={options.message}
        type={options.type}
        duration={options.duration}
        onClose={handleClose}
      />
    );
  }, []);

  return { showToast };
};