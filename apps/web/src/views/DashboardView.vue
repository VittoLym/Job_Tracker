<template>
  <div class="dashboard" :class="{ dark: isDark }">
    <!-- Header (Desktop) -->
    <header class="header md-flex">
      <div>
        <h2 class="title">Dashboard</h2>
        <p class="subtitle">Welcome back, {{ userName }}. Here's your application overview.</p>
      </div>
      <div class="header-actions">
        <button class="btn-primary" @click="handleNewApplication">
          <span class="material-symbols-outlined">add</span>
          New Application
        </button>
      </div>
    </header>

    <!-- Greeting (Mobile) -->
    <section class="greeting md-hidden">
      <h1 class="greeting-title">Hello, {{ userName }}</h1>
      <p class="greeting-subtitle">Your career portfolio is looking strong.</p>
    </section>

    <!-- Metrics Grid -->
    <section class="metrics-grid">
      <div 
        v-for="metric in metrics" 
        :key="metric.label" 
        class="metric-card"
      >
        <div class="metric-header">
          <span class="metric-label">{{ metric.label }}</span>
          <span class="material-symbols-outlined metric-icon">{{ metric.icon }}</span>
        </div>
        <div class="metric-value-row">
          <span class="metric-value">{{ metric.value }}</span>
          <span 
            class="metric-badge" 
            :class="metric.trend > 0 ? 'badge-green' : 'badge-gray'"
          >
            {{ metric.trend > 0 ? '+' : '' }}{{ metric.trend }}%
          </span>
        </div>
      </div>
    </section>

    <!-- Content Grid -->
    <div class="content-grid">
      <!-- Applications by Status -->
      <div class="card col-span-2">
        <div class="card-header">
          <h3 class="card-title">Applications by Status</h3>
        </div>
        <div class="status-bars">
          <div 
            v-for="(config, key) in statusConfig" 
            :key="key" 
            class="status-bar-row"
          >
            <div class="bar-meta">
              <span class="bar-label">{{ config.label }}</span>
              <span class="bar-count">
                {{ stats.byStatus?.[key] ?? 0 }}
                ({{ stats.total > 0 ? Math.round(((stats.byStatus?.[key] ?? 0) / stats.total) * 100) : 0 }}%)
              </span>
            </div>
            <div class="bar-track">
              <div
                class="bar-fill"
                :style="{
                  width: stats.total > 0
                    ? ((stats.byStatus?.[key] ?? 0) / stats.total * 100) + '%'
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
              @click="handleViewApplications"
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
        <button class="btn-outline" @click="handleViewApplications">
          View All Applications
        </button>
      </div>
    </div>

    <!-- Recent Applications - Desktop Table -->
    <section class="card desktop-only">
      <div class="card-header border-bottom">
        <h3 class="card-title">Recent Applications</h3>
        <button class="btn-primary" @click="handleNewApplication">
          <span class="material-symbols-outlined">add</span>
          New Application
        </button>
      </div>
      <div class="table-wrapper">
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
              @click="handleViewApplications"
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
      </div>
    </section>

    <!-- Recent Applications - Mobile Cards -->
    <section class="card mobile-only">
      <div class="card-header">
        <h3 class="card-title">Recent Applications</h3>
        <button class="btn-primary btn-small" @click="handleNewApplication">
          <span class="material-symbols-outlined">add</span>
        </button>
      </div>
      <div class="mobile-apps-list">
        <div
          v-for="app in recentApplications"
          :key="app.id + '-mobile'"
          class="mobile-app-card"
          @click="handleViewApplications"
        >
          <div class="mobile-app-header">
            <div class="company-cell">
              <div class="company-avatar">{{ app.company[0] }}</div>
              <div>
                <div class="company-name">{{ app.company }}</div>
                <div class="app-role">{{ app.role }}</div>
              </div>
            </div>
            <span
              class="status-pill"
              :style="{
                background: statusConfig[app.status]?.color + '18',
                color: statusConfig[app.status]?.color,
              }"
            >
              {{ statusConfig[app.status]?.label }}
            </span>
          </div>
          <div class="mobile-app-footer">
            <span class="text-secondary text-xs">Updated {{ timeAgo(app.updatedAt) }}</span>
          </div>
        </div>
        <div v-if="recentApplications.length === 0" class="empty">
          No applications yet
        </div>
      </div>
      <button class="btn-outline" @click="handleViewApplications">
        View All Applications
      </button>
    </section>
  </div>
</template>

```vue
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useApplicationsStore } from '../stores/applications.store';
import type { ApplicationStatus } from '../types';

const store = useApplicationsStore();

// Props & Emits
interface Application {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
}

const props = defineProps<{
  userName?: string;
  isDark?: boolean;
}>();

const emit = defineEmits<{
  (e: 'newApplication'): void;
  (e: 'viewApplications'): void;
}>();

// State
const isDark = ref(false);
const userName = ref(props.userName || 'Alex');

// --------------------------------------------------
// STORE DATA
// --------------------------------------------------

const applications = computed<Application[]>(() => store.applications);

const stats = computed(() => store.stats);

// --------------------------------------------------
// STATUS CONFIG
// --------------------------------------------------

const statusConfig: Record<
  ApplicationStatus,
  { label: string; color: string }
> = {
  APPLIED: {
    label: 'Applied',
    color: '#4f46e5',
  },
  ASSESSMENT: {
    label: 'Assessment',
    color: '#f59e0b',
  },
  INTERVIEW: {
    label: 'Interview',
    color: '#3b82f6',
  },
  OFFER: {
    label: 'Offer',
    color: '#10b981',
  },
  REJECTED: {
    label: 'Rejected',
    color: '#ef4444',
  },
  GHOSTED: {
    label: 'Ghosted',
    color: '#6b7280',
  },
};

// --------------------------------------------------
// METRICS
// --------------------------------------------------

const metrics = computed(() => [
  {
    label: 'Total Applications',
    value: stats.value.total,
    icon: 'work',
    trend: 12,
  },
  {
    label: 'Response Rate',
    value: `${stats.value.responseRate}%`,
    icon: 'forum',
    trend: 5,
  },
  {
    label: 'Interviews',
    value: stats.value.byStatus.INTERVIEW ?? 0,
    icon: 'event_available',
    trend: 2,
  },
  {
    label: 'Offers',
    value: stats.value.byStatus.OFFER ?? 0,
    icon: 'workspace_premium',
    trend: 0,
  },
]);

// --------------------------------------------------
// RECENT APPLICATIONS
// --------------------------------------------------

const recentApplications = computed(() =>
  [...applications.value]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() -
        new Date(a.updatedAt).getTime(),
    )
    .slice(0, 5),
);

// --------------------------------------------------
// METHODS
// --------------------------------------------------

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();

  const hours = Math.floor(diff / 3600000);

  if (hours < 1) return 'Just now';

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days === 1) {
    return 'Yesterday';
  }

  return `${days}d ago`;
}

function toggleTheme() {
  isDark.value = !isDark.value;

  applyTheme(isDark.value);

  localStorage.setItem(
    'theme',
    isDark.value ? 'dark' : 'light',
  );
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark);
}

function handleNewApplication() {
  emit('newApplication');
}

function handleViewApplications() {
  emit('viewApplications');
}

// --------------------------------------------------
// LIFECYCLE
// --------------------------------------------------
watch(
  () => props.isDark,
  (newValue) => {
    if (newValue !== undefined) {
      isDark.value = newValue;
    }
  },
  { immediate: true }
);
onMounted(() => {
  // Cargar aplicaciones desde la API
  store.fetchAll();

  // Theme
  const saved = localStorage.getItem('theme');

  const prefersDark = window.matchMedia(
    '(prefers-color-scheme: dark)',
  ).matches;

  isDark.value = saved
    ? saved === 'dark'
    : prefersDark;

  applyTheme(isDark.value);

  // Escuchar cambios del sistema
  const mediaQuery = window.matchMedia(
    '(prefers-color-scheme: dark)',
  );

  const handler = (event: MediaQueryListEvent) => {
    if (!localStorage.getItem('theme')) {
      isDark.value = event.matches;
      applyTheme(event.matches);
    }
  };

  mediaQuery.addEventListener('change', handler);
});

// Si cambia el theme desde otro lugar
watch(isDark, (value) => {
  applyTheme(value);
});
</script>

<style scoped>
/* Base */
.dashboard {
  --bg-primary: #fcf8ff;
  --bg-secondary: #f5f2ff;
  --bg-card: #ffffff;
  --bg-hover: #f5f2ff;
  --bg-input: #f0ecf9;
  --bg-surface: #fcf8ff;
  --text-primary: #1b1b24;
  --text-secondary: #777587;
  --text-muted: #464555;
  --border-color: #c7c4d8;
  --border-light: #e4e1ee;
  --shadow-color: rgba(0, 0, 0, 0.08);
  --metric-bg: #ffffff;
  --primary-color: #1e00a9;
  --primary-container: #3525cd;
  --on-primary: #ffffff;

  display: flex;
  flex-direction: column;
  gap: 24px;
  background: var(--bg-primary);
  padding: 24px;
  min-height: 100vh;
  transition: all 0.2s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.dashboard.dark {
  --bg-primary: #0d1117;
  --bg-secondary: #161b22;
  --bg-card: #161b22;
  --bg-hover: #1c2333;
  --bg-input: #1c2333;
  --bg-surface: #161b22;
  --text-primary: #e6edf3;
  --text-secondary: #8b949e;
  --text-muted: #6e7681;
  --border-color: #30363d;
  --border-light: #21262d;
  --shadow-color: rgba(0, 0, 0, 0.4);
  --metric-bg: #161b22;
  --primary-color: #c3c0ff;
  --primary-container: #3525cd;
  --on-primary: #ffffff;
}

/* Material Icons */
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  vertical-align: middle;
  font-size: 20px;
}

.material-symbols-outlined.filled {
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

/* Utility */
.md-hidden {
  display: none;
}

.md-flex {
  display: none;
}

.desktop-only {
  display: none;
}

.mobile-only {
  display: block;
}

@media (min-width: 768px) {
  .md-hidden {
    display: none !important;
  }
  .md-flex {
    display: flex !important;
  }
  .desktop-only {
    display: block;
  }
  .mobile-only {
    display: none !important;
  }
}

/* Mobile Header */
.mobile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 16px;
  height: 64px;
  position: sticky;
  top: 0;
  z-index: 40;
  background: var(--bg-surface);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-color);
}

.mobile-header .avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--border-color);
}

.mobile-header .brand {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary-color);
  letter-spacing: -0.025em;
}

.flex-items-center {
  display: flex;
  align-items: center;
  gap: 12px;
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
  margin: 0;
}

.subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* Theme Toggle */
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
  transition: all 0.2s ease;
}

.theme-toggle:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* Greeting (Mobile) */
.greeting {
  margin-bottom: 24px;
}

.greeting-title {
  font-size: 30px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.025em;
  margin: 0 0 4px 0;
}

.greeting-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
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
  padding: 16px;
  transition: all 0.2s ease;
}

.metric-card:hover {
  box-shadow: 0 8px 24px var(--shadow-color);
  transform: translateY(-2px);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.metric-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
}

.metric-icon {
  color: var(--primary-color);
  font-size: 20px !important;
}

.metric-value-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
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

.dashboard.dark .badge-green {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

.badge-gray {
  background: #e4e1ee;
  color: #5f5e5e;
}

.dashboard.dark .badge-gray {
  background: rgba(139, 148, 158, 0.2);
  color: #8b949e;
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-auto-flow: column;
  gap: 16px;
}

.col-span-2 {
  grid-column: span 2;
}

/* Cards */
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 8px;
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
  margin: 0;
}

/* Status Bars */
.status-bars {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-bar-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bar-meta {
  display: flex;
  justify-content: space-between;
}

.bar-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
}

.bar-count {
  font-size: 12px;
  color: var(--text-secondary);
}

.bar-track {
  height: 8px;
  background: var(--bg-input);
  border-radius: 99px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.8s cubic-bezier(0.65, 0, 0.35, 1);
  min-width: 4px;
}

/* Activity */
.activity-list {
  display: flex;
  flex-direction: column;
}

.activity-timeline {
  display: flex;
  flex-direction: column;
  border-left: 2px solid var(--border-color);
  margin-left: 8px;
}

.activity-item {
  position: relative;
  padding: 0 0 20px 20px;
  cursor: pointer;
  transition: transform 0.2s;
}

.activity-item:hover {
  transform: translateX(4px);
}

.activity-dot {
  position: absolute;
  left: -5px;
  top: 6px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--primary-color);
}

.activity-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 2px 0;
}

.activity-date {
  font-size: 11px;
  color: var(--text-secondary);
  margin: 0 0 6px 0;
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
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--primary-container);
  color: var(--on-primary);
  border: none;
  padding: 9px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: scale(0.97);
}

.btn-small {
  padding: 6px 10px;
}

.btn-small .material-symbols-outlined {
  font-size: 20px;
}

.btn-outline {
  width: 100%;
  margin-top: 16px;
  padding: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--primary-color);
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline:hover {
  background: var(--primary-container);
  color: var(--on-primary);
  border-color: var(--primary-container);
}

/* Table */
.table-wrapper {
  overflow-x: auto;
  margin-top: 4px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  min-width: 400px;
}

.table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-light);
}

.table td {
  padding: 14px 16px;
  font-size: 13px;
  border-bottom: 1px solid var(--border-light);
  color: var(--text-primary);
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
  color: var(--primary-color);
  flex-shrink: 0;
}

.company-name {
  font-weight: 500;
  color: var(--text-primary);
}

.text-secondary {
  color: var(--text-secondary);
}

.text-xs {
  font-size: 12px;
}

.empty-row {
  text-align: center;
  color: var(--text-secondary);
  padding: 32px;
}

/* Mobile Apps List */
.mobile-apps-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mobile-app-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.mobile-app-card:active {
  transform: scale(0.98);
}

.mobile-app-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.mobile-app-header .company-cell {
  flex: 1;
  min-width: 0;
}

.mobile-app-header .company-name {
  font-size: 14px;
  font-weight: 600;
}

.app-role {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.mobile-app-footer {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border-light);
}

/* Bottom Navigation */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: var(--bg-surface);
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0 8px;
  z-index: 50;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 100%;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.2s;
  gap: 2px;
}

.nav-item.active {
  color: var(--primary-color);
}

.nav-item .material-symbols-outlined {
  font-size: 24px;
}

.nav-icon-wrapper {
  padding: 4px 12px;
  background: transparent;
  border-radius: 99px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-item.active .nav-icon-wrapper {
  background: var(--primary-container);
}

.nav-item.active .nav-icon-wrapper .material-symbols-outlined {
  color: var(--on-primary);
}

.nav-label {
  font-size: 10px;
  font-weight: 600;
}

/* FAB */
.fab {
  position: fixed;
  bottom: 80px;
  right: 16px;
  width: 56px;
  height: 56px;
  background: var(--primary-container);
  color: var(--on-primary);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  z-index: 40;
  transition: all 0.2s;
}

.fab:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.fab .material-symbols-outlined {
  font-size: 28px;
}

/* Responsive */
@media (max-width: 1024px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .content-grid {
    grid-template-columns: 1fr;
    grid-auto-flow: row;
  }
  
  .col-span-2 {
    grid-column: span 1;
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 12px;
    padding-bottom: 80px;
    gap: 16px;
  }

  .metrics-grid {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .metric-card {
    padding: 12px;
  }

  .metric-value {
    font-size: 20px;
  }

  .card {
    padding: 16px;
  }

  .mobile-header {
    padding: 0 12px;
  }

  .greeting-title {
    font-size: 24px;
  }
}
</style>