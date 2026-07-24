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
              class="btn-primary"
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

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  display: inline-block;
  vertical-align: middle;
  line-height: 1;
  font-size: 20px;
}

.applications-page { display: flex; flex-direction: column; gap: 0; height: 100%; }

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 1px solid #c7c4d8;
  flex-shrink: 0;
  padding: 32px;
  padding-bottom: 0;
}
.title { 
  font-size: 28px;
  font-weight: 700;
  color: #1b1b24;
  letter-spacing: -0.5px; }
.subtitle { 
  font-size: 14px;
  color: #777587;
  margin-top: 4px;
  margin-bottom: 24px; 
}

/* Filters */
.filters-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  background: #f5f2ff;
  border-bottom: 1px solid #c7c4d8;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 12px;
}

.filters-left { display: flex; gap: 6px; flex-wrap: wrap; }
.filters-right { display: flex; align-items: center; gap: 8px; }

.filter-pill {
  padding: 6px 16px;
  border-radius: 99px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  background: #e4e1ee;
  color: #464555;
  transition: all 0.2s;
}
.filter-pill:hover { background: #4f46e5; color: #fff; transform: scale(1.03); }
.filter-pill.active { background: #3525cd; color: #fff; box-shadow: 0 2px 8px rgba(53,37,205,0.25); }

.search-wrap { position: relative; }
.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #777587;
  font-size: 18px !important;
}
.search-input {
  padding: 8px 12px 8px 36px;
  border: 1px solid #c7c4d8;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  outline: none;
  width: 240px;
  transition: all 0.2s;
  font-family: inherit;
}
.search-input:focus { border-color: #3525cd; box-shadow: 0 0 0 3px rgba(53,37,205,0.1); width: 280px; }

/* Table */
.table-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  padding-right: 20px;
  background: #fcf8ff;
}

.table-wrap > .empty {
  text-align: center;
  color: #777587;
  font-size: 14px;
  padding: 60px 0;
}

.table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border: 1px solid #c7c4d8;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

thead { background: #fff; border-bottom: 1px solid #e4e1ee; }
th {
  padding: 14px 20px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #777587;
}
.text-right { text-align: right; }

td { padding: 16px 20px; font-size: 13px; border-bottom: 1px solid #f0ecf9; }
.table-row { transition: all 0.2s; cursor: default; }
.table-row:hover { background: rgba(79,70,229,0.04); transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.table-row:last-child td { border-bottom: none; }

.company-cell { display: flex; align-items: center; gap: 12px; }
.company-avatar {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: #f0ecf9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #4f46e5;
  flex-shrink: 0;
  transition: transform 0.2s;
}
.table-row:hover .company-avatar { transform: scale(1.08); }
.company-name { font-weight: 700; color: #1b1b24; }
.role-cell { color: #464555; font-weight: 500; }

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 99px;
  transition: transform 0.2s;
}
.table-row:hover .status-badge { transform: scale(1.04); }
.badge-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

.work-mode-badge {
  font-size: 12px;
  font-weight: 500;
  padding: 3px 8px;
  background: #e4e1ee;
  color: #464555;
  border-radius: 4px;
}
.text-muted { color: #777587; }

.salary-cell { font-weight: 700; color: #1b1b24; }
.date-cell { font-size: 13px; color: #777587; }

.actions-cell { text-align: right; }
.actions-cell { display: flex; justify-content: flex-end; gap: 4px; align-items: center; }

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
  margin-bottom: 24px;
}
.btn-primary:hover { background: #4f46e5; box-shadow: 0 4px 16px rgba(53,37,205,0.35); transform: translateY(-1px); }
.btn-primary:active { transform: scale(0.97); }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

.btn-ghost {
  background: none;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #464555;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-ghost:hover { background: #f0ecf9; }

.icon-btn {
  background: none;
  border: none;
  padding: 6px;
  border-radius: 99px;
  cursor: pointer;
  color: #777587;
  display: flex;
  align-items: center;
  transition: all 0.2s;
}
.icon-btn:hover { background: #f0ecf9; color: #3525cd; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
.icon-btn.danger:hover { background: #fee2e2; color: #ef4444; }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
}

.modal {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0,0,0,0.18);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e4e1ee;
  background: #f5f2ff;
}
.modal-header h3 { font-size: 18px; font-weight: 700; color: #1b1b24; }

.modal-body { padding: 24px; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field.full { grid-column: 1 / -1; }

label { font-size: 12px; font-weight: 700; color: #464555; text-transform: uppercase; letter-spacing: 0.04em; }

input, select, textarea {
  padding: 10px 12px;
  border: 1px solid #c7c4d8;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  transition: all 0.2s;
  font-family: inherit;
  background: #fcf8ff;
  color: #1b1b24;
}
input:focus, select:focus, textarea:focus {
  border-color: #3525cd;
  box-shadow: 0 0 0 3px rgba(53,37,205,0.1);
  background: #fff;
}
textarea { resize: vertical; }

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 0;
  border-top: 1px solid #e4e1ee;
}

/* Transitions */
.modal-enter-active, .modal-leave-active { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal, .modal-leave-to .modal { transform: scale(0.95) translateY(8px); }
</style>