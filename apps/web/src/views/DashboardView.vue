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
import { computed, onMounted, ref, watch } from 'vue';
import { useApplicationsStore } from '../stores/applications.store';
import type { ApplicationStatus } from '../types';
const store = useApplicationsStore();
const isDark = ref(false);

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
onMounted(() => {
  store.fetchAll()
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  isDark.value = saved ? saved === 'dark' : prefersDark;
  applyTheme(isDark.value);
  
  // Escuchar cambios en el sistema
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e: MediaQueryListEvent) => {
    if (!localStorage.getItem('theme')) {
      isDark.value = e.matches;
      applyTheme(e.matches);
    }
  };
  mediaQuery.addEventListener('change', handler);
});
function toggleTheme() {
  isDark.value = !isDark.value;
  applyTheme(isDark.value);
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
}

function applyTheme(dark: boolean) {
  // ✅ Aplicar al HTML, NO al div del dashboard
  document.documentElement.classList.toggle('dark', dark);
}

// Watcher por si cambia desde otro lugar
watch(isDark, (val) => {
  applyTheme(val);
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
:global(:root) {
  /* Light mode */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f2ff;
  --bg-card: #ffffff;
  --bg-hover: #f5f2ff;
  --bg-input: #f0ecf9;
  --text-primary: #1b1b24;
  --text-secondary: #777587;
  --text-muted: #464555;
  --border-color: #c7c4d8;
  --border-light: #e4e1ee;
  --shadow-color: rgba(0, 0, 0, 0.08);
  --metric-bg: #ffffff;
}

:global(html.dark) {
  --bg-primary: #0d1117;
  --bg-secondary: #161b22;
  --bg-card: #161b22;
  --bg-hover: #1c2333;
  --bg-input: #1c2333;
  --text-primary: #e6edf3;
  --text-secondary: #8b949e;
  --text-muted: #6e7681;
  --border-color: #30363d;
  --border-light: #21262d;
  --shadow-color: rgba(0, 0, 0, 0.4);
  --metric-bg: #161b22;
}

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  vertical-align: middle;
  font-size: 20px;
}

.dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: var(--bg-primary);
  padding: 24px;
  min-height: 100vh;
  transition: background 0.3s ease, color 0.3s ease;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 12px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.5px;
  transition: color 0.3s ease;
}

.subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 4px;
  transition: color 0.3s ease;
}
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.theme-toggle:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  transform: scale(1.05);
}

.theme-toggle .material-symbols-outlined {
  font-size: 22px;
}
/* Metrics */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.metric-card {
  background: var(--metric-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;
}

.metric-card:hover {
  box-shadow: 0 8px 24px var(--shadow-color);
  transform: translateY(-2px);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.metric-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
  transition: color 0.3s ease;
}

.metric-icon {
  color: #4f46e5;
  font-size: 18px !important;
}

.metric-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  transition: color 0.3s ease;
}

.metric-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 99px;
}
.badge-green {
  background: #dcfce7;
  color: #15803d;
}

.dark .badge-green {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

.badge-gray {
  background: #e4e1ee;
  color: #5f5e5e;
}

.dark .badge-gray {
  background: rgba(139, 148, 158, 0.2);
  color: #8b949e;
}

/* Content Grid */
.content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
.col-span-2 { grid-column: span 1; }

/* Cards */
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
  transition: background 0.3s ease, border-color 0.3s ease;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header.border-bottom {
  border-bottom: 1px solid var(--border-light);
  padding-bottom: 16px;
  margin-bottom: 0;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  transition: color 0.3s ease;
}
.link { font-size: 12px; font-weight: 500; color: #4f46e5; text-decoration: none; cursor: pointer; background: none; border: none; }
.link:hover { text-decoration: underline; }

/* Status Bars */
.status-bars {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.status-bar-row { display: flex; flex-direction: column; gap: 6px; }
.bar-meta { display: flex; justify-content: space-between; }
.bar-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  transition: color 0.3s ease;
}
.bar-count {
  font-size: 12px;
  color: var(--text-secondary);
  transition: color 0.3s ease;
}

.bar-track {
  height: 8px;
  background: var(--bg-input);
  border-radius: 99px;
  overflow: hidden;
  transition: background 0.3s ease;
}

.bar-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.8s cubic-bezier(0.65, 0, 0.35, 1);
  min-width: 4px;
}
/* Activity */
.activity-timeline {
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--border-color);
  margin-left: 8px;
  gap: 0;
}

.activity-item {
  position: relative;
  padding: 0 0 20px 20px;
  cursor: pointer;
  transition: transform 0.2s;
}

.activity-item:hover {
  transform: translateX(2px);
}

.activity-dot {
  position: absolute;
  left: -5px;
  top: 6px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #4f46e5;
}

.activity-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
  transition: color 0.3s ease;
}

.activity-date {
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 6px;
  transition: color 0.3s ease;
}

.empty {
  font-size: 13px;
  color: var(--text-secondary);
  text-align: center;
  padding: 24px 0;
}

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

.pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

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

.btn-primary:hover {
  background: #4f46e5;
  box-shadow: 0 4px 12px rgba(53, 37, 205, 0.3);
}

.btn-primary:active {
  transform: scale(0.97);
}

.btn-outline {
  width: 100%;
  margin-top: 16px;
  padding: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #4f46e5;
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline:hover {
  background: #4f46e5;
  color: #fff;
  border-color: #4f46e5;
}

/* Table */
.table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 4px;
}

th {
  padding: 12px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-light);
  transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

td {
  padding: 14px 16px;
  font-size: 13px;
  border-bottom: 1px solid var(--border-light);
  color: var(--text-primary);
  transition: border-color 0.3s ease, color 0.3s ease;
}

.table-row {
  cursor: pointer;
  transition: background 0.15s;
}

.table-row:hover {
  background: var(--bg-hover);
}

.table-row:last-child td {
  border-bottom: none;
}

.company-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.company-avatar {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: var(--bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #4f46e5;
  flex-shrink: 0;
  transition: background 0.3s ease;
}

.company-name {
  font-weight: 500;
  color: var(--text-primary);
  transition: color 0.3s ease;
}

.text-secondary {
  color: var(--text-secondary);
  transition: color 0.3s ease;
}

.text-xs {
  font-size: 12px;
  font-weight: 500;
}

.empty-row {
  text-align: center;
  color: var(--text-secondary);
  padding: 32px;
}
@media (max-width: 1024px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .col-span-2 {
    grid-column: span 1;
  }
}

@media (max-width: 640px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .btn-primary {
    flex: 1;
    justify-content: center;
  }
  
  .dashboard {
    padding: 12px;
  }
  
  .card {
    padding: 16px;
  }
  
  .metric-value {
    font-size: 24px;
  }
  
  .table {
    font-size: 12px;
  }
  
  th, td {
    padding: 8px 10px;
  }
}
</style>