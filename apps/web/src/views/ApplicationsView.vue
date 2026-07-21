<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApplicationsStore } from '../stores/applications.store';
import type { Application, ApplicationStatus } from '../types';

const store = useApplicationsStore();

const statusConfig: Record<ApplicationStatus, { label: string; color: string }> = {
  APPLIED:    { label: 'Aplicado',   color: '#6366f1' },
  ASSESSMENT: { label: 'Assessment', color: '#f59e0b' },
  INTERVIEW:  { label: 'Entrevista', color: '#3b82f6' },
  OFFER:      { label: 'Offer',      color: '#10b981' },
  REJECTED:   { label: 'Rechazado',  color: '#ef4444' },
  GHOSTED:    { label: 'Ghosted',    color: '#6b7280' },
};

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
  if (confirm('¿Eliminar esta postulación?')) {
    await store.remove(id);
  }
}

function toggleFilter(status: ApplicationStatus) {
  store.statusFilter = store.statusFilter === status ? null : status;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

onMounted(() => store.fetchAll());
</script>

<template>
  <div class="applications">
    <header class="page-header">
      <div>
        <h1>Applications</h1>
        <span class="subtitle">{{ store.filtered.length }} postulaciones</span>
      </div>
      <button class="btn-primary" @click="openModal()">+ Nueva</button>
    </header>

    <div class="filters">
      <button
        v-for="(config, status) in statusConfig"
        :key="status"
        class="filter-btn"
        :class="{ active: store.statusFilter === status }"
        @click="toggleFilter(status as ApplicationStatus)"
      >
        {{ config.label }}
        <span class="filter-count">{{ store.stats.byStatus[status as ApplicationStatus] ?? 0 }}</span>
      </button>
      <button
        class="filter-btn"
        :class="{ active: store.statusFilter === null }"
        @click="store.statusFilter = null"
      >
        Todos
        <span class="filter-count">{{ store.stats.total }}</span>
      </button>
    </div>

    <div v-if="store.loading" class="empty">Cargando...</div>

    <div v-else-if="store.filtered.length === 0" class="empty">
      No hay postulaciones. ¡Agregá una!
    </div>

    <div v-else class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Empresa</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Modalidad</th>
            <th>Salario</th>
            <th>Fecha</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="app in store.filtered" :key="app.id">
            <td class="company-cell">
              <span class="company-name">{{ app.company }}</span>
              <a v-if="app.url" :href="app.url" target="_blank" class="company-link">↗</a>
            </td>
            <td>{{ app.role }}</td>
            <td>
              <span
                class="status-badge"
                :style="{
                  background: statusConfig[app.status]?.color + '20',
                  color: statusConfig[app.status]?.color
                }"
              >
                {{ statusConfig[app.status]?.label }}
              </span>
            </td>
            <td>{{ app.workMode ?? '—' }}</td>
            <td>{{ app.salary ? '$' + app.salary.toLocaleString() : '—' }}</td>
            <td>{{ formatDate(app.appliedAt) }}</td>
            <td class="actions">
              <button class="btn-icon" @click="openModal(app)">✏️</button>
              <button class="btn-icon btn-danger" @click="confirmDelete(app.id)">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="modalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>{{ editingId ? 'Editar postulación' : 'Nueva postulación' }}</h2>

        <div class="form-grid">
          <div class="field">
            <label>Empresa *</label>
            <input v-model="form.company" placeholder="ej. Mercado Libre" />
          </div>
          <div class="field">
            <label>Rol *</label>
            <input v-model="form.role" placeholder="ej. Backend Engineer" />
          </div>
          <div class="field">
            <label>URL</label>
            <input v-model="form.url" placeholder="https://..." />
          </div>
          <div class="field">
            <label>Estado</label>
            <select v-model="form.status">
              <option v-for="(config, key) in statusConfig" :key="key" :value="key">
                {{ config.label }}
              </option>
            </select>
          </div>
          <div class="field">
            <label>Modalidad</label>
            <select v-model="form.workMode">
              <option value="">—</option>
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ONSITE">Onsite</option>
            </select>
          </div>
          <div class="field">
            <label>Salario (USD)</label>
            <input v-model.number="form.salary" type="number" placeholder="ej. 3500" />
          </div>
          <div class="field full">
            <label>Notas</label>
            <textarea v-model="form.notes" rows="3" placeholder="Notas sobre la postulación..." />
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-secondary" @click="closeModal">Cancelar</button>
          <button class="btn-primary" :disabled="!form.company || !form.role" @click="submit">
            {{ editingId ? 'Guardar' : 'Crear' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.applications { display: flex; flex-direction: column; gap: 20px; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.page-header h1 { font-size: 24px; font-weight: 600; }
.subtitle { font-size: 14px; color: #888; margin-top: 4px; display: block; }

.filters { display: flex; gap: 8px; flex-wrap: wrap; }

.filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 99px;
  background: #fff;
  font-size: 13px;
  cursor: pointer;
  color: #555;
  transition: all 0.15s;
}

.filter-btn:hover { border-color: #1a1a1a; color: #1a1a1a; }
.filter-btn.active { background: #1a1a1a; color: #fff; border-color: #1a1a1a; }
.filter-count { font-size: 11px; opacity: 0.7; }

.table-wrapper {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
}

table { width: 100%; border-collapse: collapse; }
thead { background: #f9fafb; }
th { padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 500; color: #888; }
td { padding: 12px 16px; font-size: 13px; border-top: 1px solid #f3f4f6; }

.company-cell { display: flex; align-items: center; gap: 6px; }
.company-name { font-weight: 500; }
.company-link { color: #6366f1; text-decoration: none; font-size: 12px; }

.status-badge {
  font-size: 11px;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 99px;
}

.actions { display: flex; gap: 4px; }
.btn-icon { background: none; border: none; cursor: pointer; padding: 4px; font-size: 14px; border-radius: 4px; }
.btn-icon:hover { background: #f3f4f6; }
.btn-danger:hover { background: #fee2e2; }

.empty { text-align: center; color: #aaa; font-size: 14px; padding: 40px; }

.btn-primary {
  background: #1a1a1a;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-primary:hover { opacity: 0.85; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-secondary {
  background: #fff;
  color: #1a1a1a;
  border: 1px solid #e5e7eb;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
.btn-secondary:hover { background: #f9fafb; }

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 560px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h2 { font-size: 18px; font-weight: 600; margin-bottom: 20px; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field.full { grid-column: 1 / -1; }

label { font-size: 12px; font-weight: 500; color: #555; }

input, select, textarea {
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
  font-family: inherit;
}

input:focus, select:focus, textarea:focus { border-color: #1a1a1a; }
textarea { resize: vertical; }

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}
</style>