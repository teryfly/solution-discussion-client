import { useCallback } from 'react';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { createRoot } from 'react-dom/client';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'default' | 'danger';
}

export const useConfirm = () => {
  const showConfirm = useCallback(
    (options: ConfirmOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);

        const cleanup = () => {
          root.unmount();
          document.body.removeChild(container);
        };

        const handleConfirm = () => {
          cleanup();
          resolve(true);
        };

        const handleCancel = () => {
          cleanup();
          resolve(false);
        };

        root.render(
          <ConfirmDialog
            {...options}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        );
      });
    },
    []
  );

  return { showConfirm };
};