<template>
  <div class="applications-page">
    <!-- Header -->
    <header class="page-header">
      <div>
        <h2 class="title">Applications</h2>
        <p class="subtitle">Manage and track your job search progress</p>
      </div>
      <button class="btn-primary" @click="openModal()">
        <span class="material-symbols-outlined">add</span>
        New Application
      </button>
    </header>

    <!-- Filters -->
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
          :class="{ active: store.statusFilter === key }"
          @click="toggleFilter(key as ApplicationStatus)"
        >
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
          />
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-wrap">
      <div v-if="store.loading" class="empty">Loading...</div>
      <div v-else-if="filtered.length === 0" class="empty">
        No applications found. Add one!
      </div>
      <table v-else class="table">
        <thead>
          <tr>
            <th>Company</th>
            <th>Role</th>
            <th>Status</th>
            <th>Work Mode</th>
            <th>Salary</th>
            <th>Applied</th>
            <th class="text-right">Actions</th>
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
                <div class="company-avatar">{{ app.company[0] }}</div>
                <span class="company-name">{{ app.company }}</span>
              </div>
            </td>
            <td class="role-cell">{{ app.role }}</td>
            <td>
              <span
                class="status-badge"
                :style="{
                  background: statusConfig[app.status]?.color + '18',
                  color: statusConfig[app.status]?.color,
                }"
              >
                <span class="badge-dot" :style="{ background: statusConfig[app.status]?.color }"></span>
                {{ statusConfig[app.status]?.label }}
              </span>
            </td>
            <td>
              <span v-if="app.workMode" class="work-mode-badge">{{ app.workMode }}</span>
              <span v-else class="text-muted">—</span>
            </td>
            <td class="salary-cell">
              {{ app.salary ? '$' + app.salary.toLocaleString() : '—' }}
            </td>
            <td class="date-cell">{{ formatDate(app.appliedAt) }}</td>
            <td class="actions-cell">
              <button class="icon-btn" @click="openModal(app)" title="Edit">
                <span class="material-symbols-outlined">edit</span>
              </button>
              <button class="icon-btn danger" @click="confirmDelete(app.id)" title="Delete">
                <span class="material-symbols-outlined">delete</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <Transition name="modal">
      <div v-if="modalOpen" class="modal-overlay" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <h3>{{ editingId ? 'Edit Application' : 'New Application' }}</h3>
            <button class="icon-btn" @click="closeModal">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="modal-body">
            <div class="form-grid">
              <div class="field full">
                <label>Company Name *</label>
                <input v-model="form.company" placeholder="e.g. Google, Stripe" />
              </div>
              <div class="field full">
                <label>Job Title / Role *</label>
                <input v-model="form.role" placeholder="e.g. Senior Backend Engineer" />
              </div>
              <div class="field">
                <label>Status</label>
                <select v-model="form.status">
                  <option v-for="(config, key) in statusConfig" :key="key" :value="key">
                    {{ config.label }}
                  </option>
                </select>
              </div>
              <div class="field">
                <label>Work Mode</label>
                <select v-model="form.workMode">
                  <option value="">—</option>
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="ONSITE">On-site</option>
                </select>
              </div>
              <div class="field">
                <label>Salary (USD)</label>
                <input v-model.number="form.salary" type="number" placeholder="e.g. 3500" />
              </div>
              <div class="field">
                <label>Job URL</label>
                <input v-model="form.url" placeholder="https://..." />
              </div>
              <div class="field full">
                <label>Notes</label>
                <textarea v-model="form.notes" rows="3" placeholder="Notes about this application..." />
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-ghost" @click="closeModal">Cancel</button>
            <button
              class="btn-confirm"
              :disabled="!form.company || !form.role"
              @click="submit"
            >
              {{ editingId ? 'Save Changes' : 'Add Application' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useApplicationsStore } from '../stores/applications.store';
import type { Application, ApplicationStatus } from '../types';
import { useRoute } from 'vue-router';
 
const route = useRoute()
const store = useApplicationsStore();
const search = ref('');

const statusConfig: Record<ApplicationStatus, { label: string; color: string }> = {
  APPLIED:    { label: 'Applied',    color: '#4f46e5' },
  ASSESSMENT: { label: 'Assessment', color: '#f59e0b' },
  INTERVIEW:  { label: 'Interview',  color: '#3b82f6' },
  OFFER:      { label: 'Offer',      color: '#10b981' },
  REJECTED:   { label: 'Rejected',   color: '#ef4444' },
  GHOSTED:    { label: 'Ghosted',    color: '#6b7280' },
};

const filtered = computed(() => {
  let list = store.filtered;
  if (search.value.trim()) {
    const q = search.value.toLowerCase();
    list = list.filter(a =>
      a.company.toLowerCase().includes(q) ||
      a.role.toLowerCase().includes(q)
    );
  }
  return list;
});

// Modal
const modalOpen = ref(false);
const editingId = ref<string | null>(null);

const emptyForm = () => ({
  company: '',
  role: '',
  url: '',
  status: 'APPLIED' as ApplicationStatus,
  workMode: '' as any,
  salary: undefined as number | undefined,
  notes: '',
});

const form = ref(emptyForm());

function openModal(app?: Application) {
  if (app) {
    editingId.value = app.id;
    form.value = {
      company: app.company,
      role: app.role,
      url: app.url ?? '',
      status: app.status,
      workMode: app.workMode ?? '',
      salary: app.salary ?? undefined,
      notes: app.notes ?? '',
    };
  } else {
    editingId.value = null;
    form.value = emptyForm();
  }
  modalOpen.value = true;
}

function closeModal() {
  modalOpen.value = false;
  editingId.value = null;
  form.value = emptyForm();
}

async function submit() {
  const dto = {
    company: form.value.company,
    role: form.value.role,
    url: form.value.url || undefined,
    status: form.value.status,
    workMode: form.value.workMode || undefined,
    salary: form.value.salary || undefined,
    notes: form.value.notes || undefined,
  };

  if (editingId.value) {
    await store.update(editingId.value, dto);
  } else {
    await store.create(dto);
  }
  closeModal();
}

async function confirmDelete(id: string) {
  if (confirm('Delete this application?')) {
    await store.remove(id);
  }
}

function toggleFilter(status: ApplicationStatus) {
  store.statusFilter = store.statusFilter === status ? null : status;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

onMounted(async () => {
  await store.fetchAll();
  await nextTick();
  console.log(route.query,'este se supone es el query')
  if (route.query.new === 'true') {
    openModal();
  }
});

watch(
  () => route.query.new,
  (val) => {
    console.log(val,'monolitico')
    if (val === 'true') {
      openModal();
    }
  },
  { immediate: true }
);
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

/* ===== Variables globales ===== */
:global(:root) {
  /* Light mode */
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
}

/* ===== Estilos del componente ===== */
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  display: inline-block;
  vertical-align: middle;
  line-height: 1;
  font-size: 20px;
}

.applications-page {
  display: flex;
  flex-direction: column;
  gap: 0;
  height: 100%;
  background: var(--bg-page);
  transition: background 0.1s ease;
}

/* ===== Header ===== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  padding: 32px;
  padding-bottom: 0;
  transition: border-color 0.1s ease;
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.5px;
  transition: color 0.1s ease;
}

.subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 4px;
  margin-bottom: 24px;
  transition: color 0.1s ease;
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

.theme-toggle .material-symbols-outlined {
  font-size: 22px;
}

/* ===== Filters ===== */
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
  transition: background 0.1s ease, border-color 0.1s ease;
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
  transition: background 0.1s ease;
}

.table-wrap > .empty {
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
  padding: 60px 0;
  transition: color 0.1s ease;
}

.table {
  width: 100%;
  border-collapse: collapse;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px var(--shadow-color);
  transition: background 0.1s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

thead {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-light);
  transition: background 0.1s ease, border-color 0.3s ease;
}

th {
  padding: 14px 20px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
  transition: color 0.1s ease;
}

.text-right {
  text-align: right;
}

td {
  padding: 16px 20px;
  font-size: 13px;
  border-bottom: 1px solid var(--border-light);
  color: var(--text-primary);
  transition: border-color 0.1s ease, color 0.3s ease;
}

.table-row {
  transition: all 0.1s;
  cursor: default;
}

.table-row:hover {
  background: var(--bg-hover);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px var(--shadow-hover);
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
  transition: transform 0.2s, background 0.1s ease;
}

.table-row:hover .company-avatar {
  transform: scale(1.08);
}

.company-name {
  font-weight: 700;
  color: var(--text-primary);
  transition: color 0.1s ease;
}

.role-cell {
  color: var(--text-muted);
  font-weight: 500;
  transition: color 0.1s ease;
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
  transition: transform 0.1s;
}

.table-row:hover .status-badge {
  transform: scale(1.04);
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ===== Work Mode ===== */
.work-mode-badge {
  font-size: 12px;
  font-weight: 500;
  padding: 3px 8px;
  background: var(--border-light);
  color: var(--text-muted);
  border-radius: 4px;
  transition: background 0.1s ease, color 0.1s ease;
}

.text-muted {
  color: var(--text-secondary);
  transition: color 0.1s ease;
}

.salary-cell {
  font-weight: 700;
  color: var(--text-primary);
  transition: color 0.1s ease;
}

.date-cell {
  font-size: 13px;
  color: var(--text-secondary);
  transition: color 0.1s ease;
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

.btn-confirm {
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
  margin-right: 20px;
}

.btn-primary:hover,
.btn-confirm:hover {
  background: #4f46e5;
  box-shadow: 0 4px 16px rgba(53, 37, 205, 0.35);
  transform: translateY(-1px);
}

.btn-primary:active,
.btn-confirm:active {
  transform: scale(0.97);
}

.btn-primary:disabled,
.btn-confirm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
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
  transition: background 0.1s, color 0.1s ease;
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
  box-shadow: 0 1px 4px var(--shadow-color);
}

.icon-btn.danger:hover {
  background: #fee2e2;
  color: #ef4444;
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
  transition: background 0.1s ease, box-shadow 0.1s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-secondary);
  transition: background 0.1s ease, border-color 0.1s ease;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  transition: color 0.1s ease;
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
  transition: color 0.1s ease;
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

input::placeholder,
textarea::placeholder {
  color: var(--text-secondary);
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
  transition: border-color 0.1s ease;
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