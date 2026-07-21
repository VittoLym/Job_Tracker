<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useApplicationsStore } from '../stores/applications.store';
import type { ApplicationStatus } from '../types';

const store = useApplicationsStore();

const statusConfig: Record<ApplicationStatus, { label: string; color: string }> = {
  APPLIED:    { label: 'Aplicado',    color: '#6366f1' },
  ASSESSMENT: { label: 'Assessment',  color: '#f59e0b' },
  INTERVIEW:  { label: 'Entrevista',  color: '#3b82f6' },
  OFFER:      { label: 'Offer',       color: '#10b981' },
  REJECTED:   { label: 'Rechazado',   color: '#ef4444' },
  GHOSTED:    { label: 'Ghosted',     color: '#6b7280' },
};

const stats = computed(() => store.stats);

const recentApplications = computed(() =>
  [...store.applications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5),
);

onMounted(() => store.fetchAll());
</script>

<template>
  <div class="dashboard">
    <header class="page-header">
      <h1>Dashboard</h1>
      <span class="subtitle">Tu búsqueda de trabajo en números</span>
    </header>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">Total aplicaciones</span>
        <span class="stat-value">{{ stats.total }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Tasa de respuesta</span>
        <span class="stat-value">{{ stats.responseRate }}%</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Entrevistas</span>
        <span class="stat-value">{{ stats.byStatus.INTERVIEW ?? 0 }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Offers</span>
        <span class="stat-value highlight">{{ stats.byStatus.OFFER ?? 0 }}</span>
      </div>
    </div>

    <div class="charts-row">
      <div class="card">
        <h2>Por estado</h2>
        <div class="status-bars">
          <div
            v-for="(status, key) in statusConfig"
            :key="key"
            class="status-bar-row"
          >
            <span class="status-label">{{ status.label }}</span>
            <div class="bar-track">
              <div
                class="bar-fill"
                :style="{
                  width: stats.total > 0
                    ? ((stats.byStatus[key] ?? 0) / stats.total * 100) + '%'
                    : '0%',
                  background: status.color,
                }"
              />
            </div>
            <span class="bar-count">{{ stats.byStatus[key] ?? 0 }}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <h2>Actividad reciente</h2>
        <div class="activity-list">
          <div
            v-if="recentApplications.length === 0"
            class="empty"
          >
            No hay postulaciones aún
          </div>
          <div
            v-for="app in recentApplications"
            :key="app.id"
            class="activity-item"
          >
            <div class="activity-main">
              <span class="company">{{ app.company }}</span>
              <span class="role">{{ app.role }}</span>
            </div>
            <span
              class="status-badge"
              :style="{ background: statusConfig[app.status]?.color + '20', color: statusConfig[app.status]?.color }"
            >
              {{ statusConfig[app.status]?.label }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 24px; }

.page-header h1 { font-size: 24px; font-weight: 600; }
.subtitle { font-size: 14px; color: #888; margin-top: 4px; display: block; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-label { font-size: 13px; color: #888; }
.stat-value { font-size: 28px; font-weight: 600; color: #1a1a1a; }
.stat-value.highlight { color: #10b981; }

.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 20px;
}

.card h2 { font-size: 15px; font-weight: 600; margin-bottom: 16px; }

.status-bars { display: flex; flex-direction: column; gap: 10px; }

.status-bar-row { display: flex; align-items: center; gap: 10px; }
.status-label { font-size: 13px; color: #555; width: 90px; flex-shrink: 0; }
.bar-track { flex: 1; height: 8px; background: #f3f4f6; border-radius: 99px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 99px; transition: width 0.4s ease; min-width: 4px; }
.bar-count { font-size: 13px; color: #888; width: 20px; text-align: right; }

.activity-list { display: flex; flex-direction: column; gap: 8px; }
.empty { font-size: 13px; color: #aaa; text-align: center; padding: 20px 0; }

.activity-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.activity-main { display: flex; flex-direction: column; gap: 2px; }
.company { font-size: 13px; font-weight: 500; }
.role { font-size: 12px; color: #888; }

.status-badge {
  font-size: 11px;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 99px;
}
</style>