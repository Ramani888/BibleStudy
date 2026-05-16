import { useCallback, useState } from 'react';
import type { ConfirmDialogProps } from '../components/feedback/ConfirmDialog';

interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void | Promise<void>;
}

interface UseConfirmDialogResult {
  show: (options: ConfirmDialogOptions) => void;
  hide: () => void;
  dialogProps: ConfirmDialogProps;
}

const EMPTY_OPTIONS: ConfirmDialogOptions = {
  title: '',
  message: '',
  onConfirm: () => {},
};

export function useConfirmDialog(): UseConfirmDialogResult {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ConfirmDialogOptions>(EMPTY_OPTIONS);

  const show = useCallback((opts: ConfirmDialogOptions) => {
    setOptions(opts);
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
    setLoading(false);
  }, []);

  const handleConfirm = useCallback(async () => {
    const result = options.onConfirm();
    if (result instanceof Promise) {
      setLoading(true);
      try {
        await result;
      } catch {
        // caller is responsible for showing error toasts
      } finally {
        setLoading(false);
        setVisible(false);
      }
    } else {
      setVisible(false);
    }
  }, [options]);

  return {
    show,
    hide,
    dialogProps: {
      visible,
      loading,
      title: options.title,
      message: options.message,
      confirmLabel: options.confirmLabel,
      cancelLabel: options.cancelLabel,
      variant: options.variant,
      onConfirm: handleConfirm,
      onCancel: hide,
    },
  };
}
