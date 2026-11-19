import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { applicationsApi } from '../api/applications';
import type {
  Application,
  CreateApplicationDto,
  UpdateApplicationDto,
  ApplicationStatus,
} from '../types';

export const useApplicationsStore = defineStore('applications', () => {
  const applications = ref<Application[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const statusFilter = ref<ApplicationStatus | null>(null);

  const filtered = computed(() => {
    if (!statusFilter.value) return applications.value;

    return applications.value.filter(
      (application) => application.status === statusFilter.value,
    );
  });

  const stats = computed(() => {
    const total = applications.value.length;

    const byStatus = applications.value.reduce(
      (acc, application) => {
        acc[application.status] = (acc[application.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<ApplicationStatus, number>,
    );

    const responded =
      total - (byStatus.APPLIED ?? 0) - (byStatus.GHOSTED ?? 0);

    const responseRate =
      total > 0 ? Math.round((responded / total) * 100) : 0;

    return { total, byStatus, responseRate };
  });

  async function fetchAll() {
    loading.value = true;
    error.value = null;

    try {
      applications.value = await applicationsApi.getAll();
    } catch {
      error.value = 'Error al cargar las postulaciones';
    } finally {
      loading.value = false;
    }
  }

  async function create(dto: CreateApplicationDto) {
    const application = await applicationsApi.create(dto);
    applications.value.unshift(application);

    return application;
  }

  async function update(id: string, dto: UpdateApplicationDto) {
    const updated = await applicationsApi.update(id, dto);

    const index = applications.value.findIndex(
      (application) => application.id === id,
    );

    if (index !== -1) {
      applications.value[index] = updated;
    }

    return updated;
  }

  async function remove(id: string) {
    await applicationsApi.remove(id);

    applications.value = applications.value.filter(
      (application) => application.id !== id,
    );
  }

  return {
    applications,
    loading,
    error,
    statusFilter,
    filtered,
    stats,
    fetchAll,
    create,
    update,
    remove,
  };
});