
import { api } from './client';
import type { AppNotification } from '../types';

export const notificationsApi = {
  getAll(): Promise<AppNotification[]> {
    return api.get('/notifications').then(r => r.data);
  },
};
