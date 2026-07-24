<template>
  <div class="dashboard">
    <!-- Header -->
    <header class="header">
      <div>
        <h2 class="title">Dashboard</h2>
        <p class="subtitle">Welcome back, Vitto. Here's your application overview.</p>
      </div>
      <button class="btn-primary" @click="$router.push('/applications?new=true')">
        <span class="material-symbols-outlined">add</span>
        New Application
      </button>
    </header>

    <!-- Metrics Row -->
    <section class="metrics-grid">
      <div class="metric-card" v-for="metric in metrics" :key="metric.label">
        <div class="metric-header">
          <span class="metric-label">{{ metric.label }}</span>
          <span class="material-symbols-outlined metric-icon">{{ metric.icon }}</span>
        </div>
        <div class="metric-value-row">
          <span class="metric-value">{{ metric.value }}</span>
          <span class="metric-badge" :class="metric.trend > 0 ? 'badge-green' : 'badge-gray'">
            {{ metric.trend > 0 ? '+' : '' }}{{ metric.trend }}%
          </span>
        </div>
      </div>
    </section>

    <!-- Grid -->
    <div class="content-grid">
      <!-- Applications by Status -->
      <div class="card col-span-2">
        <div class="card-header">
          <h3 class="card-title">Applications by Status</h3>
        </div>
        <div class="status-bars">
          <div v-for="(config, key) in statusConfig" :key="key" class="status-bar-row">
            <div class="bar-meta">
              <span class="bar-label">{{ config.label }}</span>
              <span class="bar-count">
                {{ stats.byStatus[key] ?? 0 }}
                ({{ stats.total > 0 ? Math.round(((stats.byStatus[key] ?? 0) / stats.total) * 100) : 0 }}%)
              </span>
            </div>
            <div class="bar-track">
              <div
                class="bar-fill"
                :style="{
                  width: stats.total > 0
                    ? ((stats.byStatus[key] ?? 0) / stats.total * 100) + '%'
                    : '0%',
                  background: config.color,
                }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Recent Activity</h3>
        </div>
        <div class="activity-list">
          <div v-if="recentApplications.length === 0" class="empty">
            No applications yet. Add one!
          </div>
          <div v-else class="activity-timeline">
            <div
              v-for="app in recentApplications"
              :key="app.id"
              class="activity-item"
              @click="$router.push('/applications')"
            >
              <div class="activity-dot"></div>
              <div class="activity-content">
                <p class="activity-title">{{ app.company }} — {{ app.role }}</p>
                <p class="activity-date">{{ formatDate(app.appliedAt) }}</p>
                <span
                  class="status-pill"
                  :style="{
                    background: statusConfig[app.status]?.color + '18',
                    color: statusConfig[app.status]?.color,
                  }"
                >
                  <span class="pill-dot" :style="{ background: statusConfig[app.status]?.color }"></span>
                  {{ statusConfig[app.status]?.label }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <button class="btn-outline" @click="$router.push('/applications')">
          View All Applications
        </button>
      </div>
    </div>

    <!-- Top Applications Table -->
    <section class="card">
      <div class="card-header border-bottom">
        <h3 class="card-title">Recent Applications</h3>
      <button class="btn-primary" @click="$router.push('/applications?new=true')">
          <span class="material-symbols-outlined">add</span>
          New Application
        </button>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>Company</th>
            <th>Position</th>
            <th>Stage</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="recentApplications.length === 0">
            <td colspan="4" class="empty-row">No applications yet</td>
          </tr>
          <tr
            v-for="app in recentApplications"
            :key="app.id + '-table'"
            class="table-row"
            @click="$router.push('/applications')"
          >
            <td>
              <div class="company-cell">
                <div class="company-avatar">{{ app.company[0] }}</div>
                <span class="company-name">{{ app.company }}</span>
              </div>
            </td>
            <td class="text-secondary">{{ app.role }}</td>
            <td>
              <span
                class="status-pill"
                :style="{
                  background: statusConfig[app.status]?.color + '18',
                  color: statusConfig[app.status]?.color,
                }"
              >
                {{ statusConfig[app.status]?.label }}
              </span>
            </td>
            <td class="text-secondary text-xs">{{ timeAgo(app.updatedAt) }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useApplicationsStore } from '../stores/applications.store';
import type { ApplicationStatus } from '../types';
const store = useApplicationsStore();

const statusConfig: Record<ApplicationStatus, { label: string; color: string }> = {
  APPLIED:    { label: 'Applied',    color: '#4f46e5' },
  ASSESSMENT: { label: 'Assessment', color: '#f59e0b' },
  INTERVIEW:  { label: 'Interview',  color: '#3b82f6' },
  OFFER:      { label: 'Offer',      color: '#10b981' },
  REJECTED:   { label: 'Rejected',   color: '#ef4444' },
  GHOSTED:    { label: 'Ghosted',    color: '#6b7280' },
};

const stats = computed(() => store.stats);

const metrics = computed(() => [
  { label: 'Total Applications', value: stats.value.total, icon: 'assignment', trend: 12 },
  { label: 'Response Rate',      value: stats.value.responseRate + '%', icon: 'trending_up', trend: 5 },
  { label: 'Interviews',         value: stats.value.byStatus.INTERVIEW ?? 0, icon: 'calendar_month', trend: 2 },
  { label: 'Offers',             value: stats.value.byStatus.OFFER ?? 0, icon: 'workspace_premium', trend: 0 },
]);

const recentApplications = computed(() =>
  [...store.applications]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5),
);

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

onMounted(() => store.fetchAll());
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  vertical-align: middle;
  font-size: 20px;
}

.dashboard { display: flex; flex-direction: column; gap: 24px; }

/* Header */
.header { display: flex; justify-content: space-between; align-items: flex-end; }
.title { font-size: 28px; font-weight: 700; color: #1b1b24; letter-spacing: -0.5px; }
.subtitle { font-size: 14px; color: #777587; margin-top: 4px; }

/* Metrics */
.metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }

.metric-card {
  background: #fff;
  border: 1px solid #c7c4d8;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;
}

.metric-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-2px); }

.metric-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.metric-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #777587; }
.metric-icon { color: #4f46e5; font-size: 18px !important; }
.metric-value-row { display: flex; align-items: baseline; gap: 10px; }
.metric-value { font-size: 32px; font-weight: 700; color: #1b1b24; }
.metric-badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 99px; }
.badge-green { background: #dcfce7; color: #15803d; }
.badge-gray  { background: #e4e1ee; color: #5f5e5e; }

/* Content Grid */
.content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
.col-span-2 { grid-column: span 1; }

/* Cards */
.card { background: #fff; border: 1px solid #c7c4d8; border-radius: 12px; padding: 24px; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.card-header.border-bottom { border-bottom: 1px solid #e4e1ee; padding-bottom: 16px; margin-bottom: 0; }
.card-title { font-size: 15px; font-weight: 600; color: #1b1b24; }
.link { font-size: 12px; font-weight: 500; color: #4f46e5; text-decoration: none; cursor: pointer; background: none; border: none; }
.link:hover { text-decoration: underline; }

/* Status Bars */
.status-bars { display: flex; flex-direction: column; gap: 16px; }
.status-bar-row { display: flex; flex-direction: column; gap: 6px; }
.bar-meta { display: flex; justify-content: space-between; }
.bar-label { font-size: 12px; font-weight: 500; color: #464555; }
.bar-count { font-size: 12px; color: #777587; }
.bar-track { height: 8px; background: #f0ecf9; border-radius: 99px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 99px; transition: width 0.8s cubic-bezier(0.65, 0, 0.35, 1); min-width: 4px; }

/* Activity */
.activity-timeline { display: flex; flex-direction: column; border-left: 1px solid #c7c4d8; margin-left: 8px; gap: 0; }
.activity-item {
  position: relative;
  padding: 0 0 20px 20px;
  cursor: pointer;
  transition: transform 0.2s;
}
.activity-item:hover { transform: translateX(2px); }
.activity-dot {
  position: absolute;
  left: -5px;
  top: 6px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #4f46e5;
}
.activity-title { font-size: 13px; font-weight: 600; color: #1b1b24; margin-bottom: 2px; }
.activity-date { font-size: 11px; color: #777587; margin-bottom: 6px; }

.empty { font-size: 13px; color: #777587; text-align: center; padding: 24px 0; }

/* Status Pill */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 99px;
}
.pill-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

/* Buttons */
.btn-primary {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #3525cd;
  color: #fff;
  border: none;
  padding: 9px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-primary:hover { background: #4f46e5; box-shadow: 0 4px 12px rgba(53,37,205,0.3); }
.btn-primary:active { transform: scale(0.97); }

.btn-outline {
  width: 100%;
  margin-top: 16px;
  padding: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #4f46e5;
  background: none;
  border: 1px solid #c7c4d8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-outline:hover { background: #4f46e5; color: #fff; border-color: #4f46e5; }

/* Table */
.table { width: 100%; border-collapse: collapse; margin-top: 4px; }
th {
  padding: 12px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 500;
  color: #777587;
  background: #f5f2ff;
  border-bottom: 1px solid #e4e1ee;
}
td { padding: 14px 16px; font-size: 13px; border-bottom: 1px solid #f0ecf9; }
.table-row { cursor: pointer; transition: background 0.15s; }
.table-row:hover { background: #f5f2ff; }
.table-row:last-child td { border-bottom: none; }

.company-cell { display: flex; align-items: center; gap: 10px; }
.company-avatar {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #f0ecf9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #4f46e5;
  flex-shrink: 0;
}
.company-name { font-weight: 500; color: #1b1b24; }
.text-secondary { color: #777587; }
.text-xs { font-size: 12px; font-weight: 500; }
.empty-row { text-align: center; color: #777587; padding: 32px; }
</style>