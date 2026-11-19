
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { notificationsApi } from '../api/notifications';
import type { AppNotification } from '../types';

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<AppNotification[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const count = computed(() => notifications.value.length);

  async function fetchAll() {
    loading.value = true;
    error.value = null;

    try {
      notifications.value = await notificationsApi.getAll();
    } catch {
      error.value = 'Error al cargar las notificaciones';
    } finally {
      loading.value = false;
    }
  }

  return {
    notifications,
    loading,
    error,
    count,
    fetchAll,
  };
});
