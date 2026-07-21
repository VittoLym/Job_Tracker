import { api } from './client';
import type { Application, CreateApplicationDto, UpdateApplicationDto, ApplicationStatus } from '../types';

export const applicationsApi = {
  getAll(status?: ApplicationStatus): Promise<Application[]> {
    return api.get('/applications', { params: status ? { status } : {} })
      .then(r => r.data);
  },

  getOne(id: string): Promise<Application> {
    return api.get(`/applications/${id}`).then(r => r.data);
  },

  create(dto: CreateApplicationDto): Promise<Application> {
    return api.post('/applications', dto).then(r => r.data);
  },

  update(id: string, dto: UpdateApplicationDto): Promise<Application> {
    return api.patch(`/applications/${id}`, dto).then(r => r.data);
  },

  remove(id: string): Promise<void> {
    return api.delete(`/applications/${id}`).then(r => r.data);
  },
};