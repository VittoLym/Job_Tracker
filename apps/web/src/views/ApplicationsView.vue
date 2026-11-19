<template>
  <div
    class="applications-page"
  >
    <!-- Header -->
    <header class="page-header">
      <div>
        <h2 class="title">
          Applications
        </h2>
        <p class="subtitle">
          Manage and track your job search progress
        </p>
      </div>
      <div class="header-actions">
        <button
          class="btn-primary"
          @click="openModal()"
        >
          <span class="material-symbols-outlined">add</span>
          New Application
        </button>
      </div>
    </header>
    <header class="mobile-page-header">
      <div class="mobile-brand">
        <div class="mobile-brand-text">
          <h1>Job Tracker</h1>
          <span>Applications</span>
        </div>
      </div>

      <button
        class="mobile-add-btn"
        aria-label="New application"
        @click="openModal()"
      >
        <span class="material-symbols-outlined">add</span>
      </button>
    </header>
    <!-- Filters Bar -->
    <div class="filters-bar">
      <div class="filters-left">
        <button
          class="filter-pill"
          :class="{ active: store.statusFilter === null }"
          @click="store.statusFilter = null"
        >
          All
        </button>
        <button
          v-for="(config, key) in statusConfig"
          :key="key"
          class="filter-pill"
          :class="{ 
            active: store.statusFilter === key,
            'filter-pill-with-dot': true
          }"
          @click="toggleFilter(key as ApplicationStatus)"
        >
          <span
            v-if="config.dotColor"
            class="filter-dot"
            :style="{ background: config.dotColor }"
          />
          {{ config.label }}
        </button>
      </div>
      <div class="filters-right">
        <div class="search-wrap">
          <span class="material-symbols-outlined search-icon">search</span>
          <input
            v-model="search"
            class="search-input"
            placeholder="Search companies..."
            type="text"
          >
        </div>
      </div>
    </div>

    <!-- Desktop Table View -->
    <div class="table-wrap desktop-only">
      <div
        v-if="store.loading"
        class="empty"
      >
        Loading...
      </div>
      <div
        v-else-if="filtered.length === 0"
        class="empty"
      >
        No applications found. Add one!
      </div>
      <table
        v-else
        class="table"
      >
        <thead>
          <tr>
            <th>Company</th>
            <th>Role</th>
            <th>Status</th>
            <th>Work Mode</th>
            <th>Salary</th>
            <th>Applied</th>
            <th class="text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="app in filtered"
            :key="app.id"
            class="table-row"
          >
            <td>
              <div class="company-cell">
                <div class="company-avatar">
                  {{ app.company[0] }}
                </div>
                <span class="company-name">{{ app.company }}</span>
              </div>
            </td>
            <td class="role-cell">
              {{ app.role }}
            </td>
            <td>
              <span
                class="status-badge"
                :style="{
                  background: statusConfig[app.status]?.color + '18',
                  color: statusConfig[app.status]?.color,
                }"
              >
                <span
                  class="badge-dot"
                  :style="{ background: statusConfig[app.status]?.color }"
                />
                {{ statusConfig[app.status]?.label }}
              </span>
            </td>
            <td>
              <span
                v-if="app.workMode"
                class="work-mode-badge"
              >{{ app.workMode }}</span>
              <span
                v-else
                class="text-muted"
              >—</span>
            </td>
            <td class="salary-cell">
              {{ app.salary ? '$' + app.salary.toLocaleString() : '—' }}
            </td>
            <td class="date-cell">
              {{ formatDate(app.appliedAt) }}
            </td>
            <td class="actions-cell">
              <button
                class="icon-btn"
                title="Edit"
                @click="openModal(app)"
              >
                <span class="material-symbols-outlined">edit</span>
              </button>
              <button
                class="icon-btn danger"
                title="Delete"
                @click="confirmDelete(app.id)"
              >
                <span class="material-symbols-outlined">delete</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Cards View -->
    <div class="mobile-cards-view md-hidden">
      <!-- Search (Mobile) -->
      <div class="search-wrapper">
        <div class="search-container">
          <span class="material-symbols-outlined search-icon">search</span>
          <input
            v-model="search"
            class="search-input-mobile"
            placeholder="Search applications..."
            type="text"
          >
        </div>
      </div>

      <!-- Filter Pills (Mobile) -->
      <div class="filters-wrapper">
        <div class="filters-scroll">
          <button
            class="filter-pill-mobile"
            :class="{ active: store.statusFilter === null }"
            @click="store.statusFilter = null"
          >
            All
          </button>
          <button
            v-for="(config, key) in statusConfig"
            :key="key"
            class="filter-pill-mobile"
            :class="{ 
              active: store.statusFilter === key,
              'filter-pill-with-dot': true
            }"
            @click="toggleFilter(key as ApplicationStatus)"
          >
            <span
              v-if="config.dotColor"
              class="filter-dot"
              :style="{ background: config.dotColor }"
            />
            {{ config.label }}
          </button>
        </div>
      </div>

      <!-- Cards -->
      <div class="cards-container">
        <div
          v-if="store.loading"
          class="empty"
        >
          Loading...
        </div>
        <div
          v-else-if="filtered.length === 0"
          class="empty"
        >
          No applications found.
        </div>
        <div
          v-for="app in filtered"
          v-else
          :key="app.id"
          class="app-card"
          @click="openModal(app)"
        >
          <div class="app-card-header">
            <div class="app-card-company">
              <div class="app-card-avatar">
                {{ app.company[0] }}
              </div>
              <div>
                <h3 class="app-card-title">
                  {{ app.role }}
                </h3>
                <p class="app-card-subtitle">
                  {{ app.company }}
                </p>
              </div>
            </div>
            <button
              class="app-card-menu"
              @click.stop="toggleMenuOptions(app.id)"
            >
              <span class="material-symbols-outlined">more_vert</span>
            </button>
          </div>

          <div class="app-card-tags">
            <span
              class="tag"
              :class="getStatusClass(app.status)"
            >
              {{ statusConfig[app.status]?.label }}
            </span>
            <span
              v-if="app.workMode"
              class="tag tag-secondary"
            >{{ app.workMode }}</span>
            <span
              v-if="app.salary"
              class="tag tag-secondary"
            >${{ app.salary.toLocaleString() }}</span>
          </div>

          <div class="app-card-footer">
            <div class="footer-item">
              <span class="material-symbols-outlined footer-icon">event</span>
              <span>Applied: {{ formatDate(app.appliedAt) }}</span>
            </div>
            <div
              class="footer-item"
              :class="getFooterStatusClass(app)"
            >
              <span class="material-symbols-outlined footer-icon">{{ getFooterIcon(app) }}</span>
              <span>{{ getFooterText(app) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <ApplicationModal
      v-model="modalOpen"
      :application="editingApp"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import type {
  Application,
  ApplicationStatus,
  ApplicationPayload,
} from '../types';
import { useApplicationsStore } from '../stores/applications.store';
import ApplicationModal from '../components/ApplicationModal.vue';
import { statusConfig } from '../constants/application-status.ts';

const modalOpen = ref(false);
const editingApp = ref<Application | null>(null);

function openModal(app?: Application) {
  editingApp.value = app ?? null;
  modalOpen.value = true;
}

const emit = defineEmits<{
  (e: 'newApplication'): void;
  (e: 'viewApplication', id: string): void;
  (e: 'notifications'): void;
  (e: 'toggleMenu'): void;
  (e: 'navigate', tab: string): void;
}>();

// Store
// const store = useApplicationsStore();
const store = useApplicationsStore();;

// State
const isDark = ref(false);
const search = ref('');
const route = useRoute();

// Computed
const filtered = computed(() => {
  let list = store.applications || [];
  
  // Apply status filter
  if (store.statusFilter) {
    list = list.filter(a => a.status === store.statusFilter);
  }
  
  // Apply search
  if (search.value.trim()) {
    const q = search.value.toLowerCase();
    list = list.filter(a =>
      a.company.toLowerCase().includes(q) ||
      a.role.toLowerCase().includes(q)
    );
  }
  
  return list;
});

// Methods
function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
}
async function handleSave(payload: ApplicationPayload, id: string | null) {
  if (id) {
    await store.update(id, payload);
  } else {
    await store.create(payload);
  }
  modalOpen.value = false;
  emit('newApplication');
}
function toggleFilter(status: ApplicationStatus) {
  store.statusFilter = store.statusFilter === status ? null : status;
}
function getStatusClass(status: string) {
  const classes = {
    'APPLIED': 'tag-applied',
    'ASSESSMENT': 'tag-assessment',
    'INTERVIEW': 'tag-interview',
    'OFFER': 'tag-offer',
    'REJECTED': 'tag-rejected',
    'GHOSTED': 'tag-ghosted',
  };
  return classes[status as keyof typeof classes] || 'tag-default';
}
function getFooterIcon(app: Application) {
  if (app.status === 'OFFER') return 'check_circle';
  if (app.status === 'ASSESSMENT') return 'assignment';
  if (app.status === 'INTERVIEW') return 'schedule';
  if (app.status === 'APPLIED') return 'hourglass_empty';
  return 'event';
}
function getFooterText(app: Application) {
  if (app.status === 'OFFER') return 'Offer Received';
  if (app.status === 'ASSESSMENT') return 'Assessment Pending';
  if (app.status === 'INTERVIEW') return 'Interview Scheduled';
  if (app.status === 'APPLIED') return 'Awaiting Review';
  return '';
}
function getFooterStatusClass(app: Application) {
  if (app.status === 'OFFER') return 'footer-success';
  if (app.status === 'ASSESSMENT') return 'footer-warning';
  if (app.status === 'INTERVIEW') return 'footer-info';
  return '';
}
async function confirmDelete(id: string) {
  if (confirm('Delete this application?')) {
    await store.remove(id);
  }
}
function toggleMenuOptions(id: string) {
  // Implement menu options
  console.log('Menu options for:', id);
}

// Lifecycle
onMounted(async () => {
  // Cargar datos
  await store.fetchAll?.();
  
  // Theme
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  isDark.value = saved ? saved === 'dark' : prefersDark;
  
  // Media query para dark mode
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e: MediaQueryListEvent) => {
    if (!localStorage.getItem('theme')) {
      isDark.value = e.matches;
    }
  };
  mediaQuery.addEventListener('change', handler);
  
  // Abrir modal si viene con query param
  if (route.query.new === 'true') {
    openModal();
  }
});

watch(
  () => route.query.new,
  (val) => {
    if (val === 'true') {
      openModal();
    }
  },
  { immediate: true }
);
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

/* ===== Variables ===== */
:global(:root) {
  --bg-page: #fcf8ff;
  --bg-card: #ffffff;
  --bg-secondary: #f5f2ff;
  --bg-input: #fcf8ff;
  --bg-hover: rgba(79, 70, 229, 0.04);
  --text-primary: #1b1b24;
  --text-secondary: #777587;
  --text-muted: #464555;
  --border-color: #c7c4d8;
  --border-light: #e4e1ee;
  --shadow-color: rgba(0, 0, 0, 0.05);
  --shadow-hover: rgba(0, 0, 0, 0.06);
  --modal-overlay: rgba(0, 0, 0, 0.4);
  --primary-color: #1e00a9;
  --primary-container: #3525cd;
  --on-primary: #ffffff;
  --info: #3b82f6;
  --warning: #f59e0b;
  --success: #16a34a;
  --error: #ba1a1a;
}

:global(html.dark) {
  --bg-page: #0d1117;
  --bg-card: #161b22;
  --bg-secondary: #161b22;
  --bg-input: #0d1117;
  --bg-hover: rgba(255, 255, 255, 0.03);
  --text-primary: #e6edf3;
  --text-secondary: #8b949e;
  --text-muted: #6e7681;
  --border-color: #30363d;
  --border-light: #21262d;
  --shadow-color: rgba(0, 0, 0, 0.2);
  --shadow-hover: rgba(0, 0, 0, 0.3);
  --modal-overlay: rgba(0, 0, 0, 0.7);
  --primary-color: #c3c0ff;
}

/* ===== Base ===== */
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  display: inline-block;
  vertical-align: middle;
  line-height: 1;
  font-size: 20px;
}

.material-symbols-outlined.filled {
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

.applications-page {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 100vh;
  background: var(--bg-page);
  transition: background 0.2s ease;
}

/* ===== Mobile Page Header ===== */
.mobile-page-header {
  display: none;
}

@media (max-width: 768px) {
  .mobile-page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    background: var(--bg-card);
    border-bottom: 1px solid var(--border-color);
    position: sticky;
    top: 0;
    z-index: 40;
  }

  .mobile-brand {
    display: flex;
    align-items: center;
    gap: 11px;
  }

  .mobile-brand-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 11px;
    background: var(--primary-container);
    color: white;
  }

  .mobile-brand-icon .material-symbols-outlined {
    font-size: 22px;
  }

  .mobile-brand-text h1 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.3px;
  }

  .mobile-brand-text span {
    display: block;
    margin-top: 2px;
    font-size: 12px;
    color: var(--text-secondary);
  }

  .mobile-add-btn {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 11px;
    background: var(--primary-container);
    color: white;
    cursor: pointer;
    transition: transform 0.15s ease;
  }

  .mobile-add-btn:active {
    transform: scale(0.94);
  }
}

/* ===== Utility ===== */
.md-hidden {
  display: none;
}

.desktop-only {
  display: block;
}

@media (max-width: 768px) {
  .md-hidden {
    display: block !important;
  }
  .desktop-only {
    display: none !important;
  }
}

/* ===== Page Header (Desktop) ===== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 1px solid var(--border-color);
  padding: 32px;
  padding-bottom: 0;
  transition: border-color 0.2s ease;
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
}

.subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 4px;
  margin-bottom: 24px;
}

/* ===== Theme Toggle ===== */
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.1s ease;
}

.theme-toggle:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
  transform: scale(1.05);
}

/* ===== Mobile Header ===== */
.mobile-header {
  display: none;
  position: sticky;
  top: 0;
  z-index: 40;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 64px;
  padding: 0 16px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
}

@media (max-width: 768px) {
  .mobile-header {
    display: flex;
  }
  .page-header {
    display: none;
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-btn {
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  padding: 4px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--primary-color);
  letter-spacing: -0.025em;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.add-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary-container);
  color: var(--on-primary);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.add-btn:active {
  transform: scale(0.95);
}

.notif-btn {
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  position: relative;
  padding: 4px;
}

.notif-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--error);
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--border-color);
}

/* ===== Filters Bar ===== */
.filters-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 12px;
}

@media (max-width: 768px) {
  .filters-bar {
    display: none;
  }
}

.filters-left {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filters-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-pill {
  padding: 6px 16px;
  border-radius: 99px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  background: var(--border-light);
  color: var(--text-muted);
  transition: all 0.1s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-pill:hover {
  background: #4f46e5;
  color: #fff;
  transform: scale(1.03);
}

.filter-pill.active {
  background: #3525cd;
  color: #fff;
  box-shadow: 0 2px 8px rgba(53, 37, 205, 0.25);
}

.filter-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ===== Search ===== */
.search-wrap {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  font-size: 18px !important;
}

.search-input {
  padding: 8px 12px 8px 36px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-card);
  font-size: 13px;
  outline: none;
  width: 240px;
  transition: all 0.1s;
  font-family: inherit;
  color: var(--text-primary);
}

.search-input::placeholder {
  color: var(--text-secondary);
}

.search-input:focus {
  border-color: #3525cd;
  box-shadow: 0 0 0 3px rgba(53, 37, 205, 0.1);
  width: 280px;
}

/* ===== Table ===== */
.table-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  padding-right: 20px;
  background: var(--bg-page);
}

.table {
  width: 100%;
  border-collapse: collapse;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px var(--shadow-color);
}

thead {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-light);
}

th {
  padding: 14px 20px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
}

.text-right {
  text-align: right;
}

td {
  padding: 16px 20px;
  font-size: 13px;
  border-bottom: 1px solid var(--border-light);
  color: var(--text-primary);
}

.table-row {
  transition: all 0.1s;
  cursor: default;
}

.table-row:hover {
  background: var(--bg-hover);
}

.table-row:last-child td {
  border-bottom: none;
}

/* ===== Company Cell ===== */
.company-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.company-avatar {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #4f46e5;
  flex-shrink: 0;
}

.company-name {
  font-weight: 700;
  color: var(--text-primary);
}

.role-cell {
  color: var(--text-muted);
  font-weight: 500;
}

/* ===== Status Badge ===== */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 99px;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.work-mode-badge {
  font-size: 12px;
  font-weight: 500;
  padding: 3px 8px;
  background: var(--border-light);
  color: var(--text-muted);
  border-radius: 4px;
}

.text-muted {
  color: var(--text-secondary);
}

.salary-cell {
  font-weight: 700;
  color: var(--text-primary);
}

.date-cell {
  font-size: 13px;
  color: var(--text-secondary);
}

.actions-cell {
  text-align: right;
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  align-items: center;
}

/* ===== Buttons ===== */
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
  transition: all 0.1s;
  margin-bottom: 24px;
}

.btn-primary:hover {
  background: #4f46e5;
  box-shadow: 0 4px 16px rgba(53, 37, 205, 0.35);
  transform: translateY(-1px);
}

.btn-confirm {
  background: #3525cd;
  color: #fff;
  border: none;
  padding: 9px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.1s;
}

.btn-confirm:hover {
  background: #4f46e5;
  box-shadow: 0 4px 16px rgba(53, 37, 205, 0.35);
}

.btn-confirm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-ghost {
  background: none;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-muted);
  cursor: pointer;
  transition: background 0.1s;
}

.btn-ghost:hover {
  background: var(--border-light);
}

.icon-btn {
  background: none;
  border: none;
  padding: 6px;
  border-radius: 99px;
  cursor: pointer;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  transition: all 0.1s;
}

.icon-btn:hover {
  background: var(--border-light);
  color: #3525cd;
}

.icon-btn.danger:hover {
  background: #fee2e2;
  color: #ef4444;
}

/* ===== Mobile Cards ===== */
.mobile-cards-view {
  display: none;
  flex: 1;
  overflow-y: auto;
  padding-bottom: 80px;
}

@media (max-width: 768px) {
  .mobile-cards-view {
    display: block;
  }
}

/* Search Mobile */
.search-wrapper {
  padding: 16px;
  background: var(--bg-page);
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.search-input-mobile {
  width: 100%;
  padding: 10px 16px 10px 44px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.2s;
  outline: none;
}

.search-input-mobile:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(30, 0, 169, 0.1);
}

/* Filters Mobile */
.filters-wrapper {
  padding: 0 16px 16px;
  overflow-x: auto;
  background: var(--bg-page);
}

.filters-scroll {
  display: flex;
  gap: 8px;
  white-space: nowrap;
  overflow-x: auto;
  padding: 4px 0;
  scrollbar-width: none;
}

.filters-scroll::-webkit-scrollbar {
  display: none;
}

.filter-pill-mobile {
  padding: 6px 16px;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.filter-pill-mobile.active {
  background: var(--primary-container);
  color: var(--on-primary);
  border-color: var(--primary-container);
}

/* Cards */
.cards-container {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.app-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.app-card:active {
  transform: scale(0.98);
}

.app-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.app-card-company {
  display: flex;
  gap: 12px;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.app-card-avatar {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: #4f46e5;
  flex-shrink: 0;
}

.app-card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 2px 0;
}

.app-card-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.app-card-menu {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
}

.app-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.tag {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.tag-applied {
  background: var(--bg-input);
  color: var(--text-muted);
  border: 1px solid var(--border-color);
}

.tag-interview {
  background: rgba(59, 130, 246, 0.1);
  color: var(--info);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.tag-assessment {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.tag-offer {
  background: rgba(22, 163, 74, 0.1);
  color: var(--success);
  border: 1px solid rgba(22, 163, 74, 0.2);
}

.tag-rejected {
  background: rgba(186, 26, 26, 0.1);
  color: var(--error);
  border: 1px solid rgba(186, 26, 26, 0.2);
}

.tag-ghosted {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
  border: 1px solid rgba(107, 114, 128, 0.2);
}

.tag-secondary {
  background: var(--bg-input);
  color: var(--text-muted);
  border: 1px solid var(--border-color);
}

.app-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
}

.footer-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.footer-icon {
  font-size: 14px;
}

.footer-success {
  color: var(--success);
}

.footer-warning {
  color: var(--warning);
}

.footer-info {
  color: var(--info);
}

/* ===== Bottom Navigation (Mobile) ===== */
.bottom-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: var(--bg-card);
  border-top: 1px solid var(--border-color);
  z-index: 50;
  justify-content: space-around;
  align-items: center;
  padding: 0 8px;
}

@media (max-width: 768px) {
  .bottom-nav {
    display: flex;
  }
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.2s;
  gap: 2px;
  min-width: 64px;
  cursor: pointer;
  border-radius: 8px;
}

.nav-item .material-symbols-outlined {
  font-size: 24px;
}

.nav-item-active {
  color: var(--primary-color);
  background: rgba(30, 0, 169, 0.05);
}

.nav-label {
  font-size: 10px;
  font-weight: 600;
  text-align: center;
}

/* ===== Empty State ===== */
.empty {
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
  padding: 60px 0;
}

/* ===== Modal ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--modal-overlay);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
}

.modal {
  background: var(--bg-card);
  border-radius: 16px;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 64px var(--shadow-color);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-secondary);
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.modal-body {
  padding: 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field.full {
  grid-column: 1 / -1;
}

label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

input,
select,
textarea {
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  transition: all 0.1s;
  font-family: inherit;
  background: var(--bg-input);
  color: var(--text-primary);
}

input:focus,
select:focus,
textarea:focus {
  border-color: #3525cd;
  box-shadow: 0 0 0 3px rgba(53, 37, 205, 0.1);
  background: var(--bg-card);
}

textarea {
  resize: vertical;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-light);
}

/* ===== Transitions ===== */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: scale(0.95) translateY(8px);
}

/* ===== Scrollbar ===== */
.table-wrap::-webkit-scrollbar {
  width: 6px;
}

.table-wrap::-webkit-scrollbar-track {
  background: var(--bg-page);
}

.table-wrap::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.table-wrap::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}
</style>