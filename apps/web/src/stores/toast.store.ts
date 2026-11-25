
import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: number;
  type: ToastType;
  title: string;
  message: string;
  duration: number;
}

interface ToastOptions {
  type?: ToastType;
  title: string;
  message: string;
  duration?: number;
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<ToastMessage[]>([]);
  let nextId = 0;

  const timers = new Map<number, ReturnType<typeof setTimeout>>();

  function dismissToast(id: number) {
    const timer = timers.get(id);

    if (timer) {
      clearTimeout(timer);
      timers.delete(id);
    }

    toasts.value = toasts.value.filter(toast => toast.id !== id);
  }

  function showToast(options: ToastOptions) {
    const id = ++nextId;

    const toast: ToastMessage = {
      id,
      type: options.type ?? 'info',
      title: options.title,
      message: options.message,
      duration: options.duration ?? 5000,
    };

    toasts.value.push(toast);

    if (toast.duration > 0) {
      const timer = setTimeout(() => {
        dismissToast(id);
      }, toast.duration);

      timers.set(id, timer);
    }

    return id;
  }

  function clearAll() {
    for (const timer of timers.values()) {
      clearTimeout(timer);
    }

    timers.clear();
    toasts.value = [];
  }

  return {
    toasts,
    showToast,
    dismissToast,
    clearAll,
  };
});
