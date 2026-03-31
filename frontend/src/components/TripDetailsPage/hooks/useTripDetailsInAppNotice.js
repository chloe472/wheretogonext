import { useCallback } from 'react';
import toast from 'react-hot-toast';

export function useTripDetailsInAppNotice() {
  return useCallback((message, type = 'info', durationMs = 3200) => {
    if (!message) return;

    const normalizedMessage = String(message).trim().toLowerCase();
    if (/^inserted a new day (before|after) day \d+\.?$/.test(normalizedMessage)) return;

    const toastOptions = { duration: durationMs };
    if (type === 'success') {
      toast.success(message, toastOptions);
      return;
    }

    if (type === 'warning') {
      toast(message, { ...toastOptions, icon: '⚠️' });
      return;
    }

    if (type === 'error') {
      toast.error(message, toastOptions);
      return;
    }

    toast(message, toastOptions);
  }, []);
}
