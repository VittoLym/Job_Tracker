<template>
  <Transition name="modal">
    <div
      v-if="modelValue"
      class="modal-overlay"
      @click.self="close"
    >
      <div
        class="modal"
        role="dialog"
        aria-modal="true"
      >
        <div class="modal-header">
          <h3>
            {{ isEditing ? 'Edit Application' : 'New Application' }}
          </h3>
          <button
            type="button"
            class="modal-close"
            aria-label="Close"
            @click="close"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <form @submit.prevent="submit">
          <div class="modal-body">
            <div class="form-grid">
              <div class="field full">
                <label>Company Name *</label>
                <input
                  v-model="form.company"
                  placeholder="e.g. Google, Stripe"
                >
              </div>
              <div class="field full">
                <label>Job Title / Role *</label>
                <input
                  v-model="form.role"
                  placeholder="e.g. Senior Backend Engineer"
                >
              </div>
              <div class="field">
                <label>Status</label>
                <select v-model="form.status">
                  <option
                    v-for="(config, key) in statusConfig"
                    :key="key"
                    :value="key"
                  >
                    {{ config.label }}
                  </option>
                </select>
              </div>
              <div class="field">
                <label>Work Mode</label>
                <select v-model="form.workMode">
                  <option value="">
                    —
                  </option>
                  <option value="REMOTE">
                    Remote
                  </option>
                  <option value="HYBRID">
                    Hybrid
                  </option>
                  <option value="ONSITE">
                    On-site
                  </option>
                </select>
              </div>
              <div class="field">
                <label>Salary (USD)</label>
                <input
                  v-model.number="form.salary"
                  type="number"
                  placeholder="e.g. 3500"
                >
              </div>
              <div class="field">
                <label>Job URL</label>
                <input
                  v-model="form.url"
                  placeholder="https://..."
                >
              </div>
              <div class="field full">
                <label>Notes</label>
                <textarea
                  v-model="form.notes"
                  rows="3"
                  placeholder="Notes about this application..."
                />
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="btn-ghost"
              @click="close"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn-confirm"
              :disabled="!canSubmit"
            >
              {{ isEditing ? 'Save changes' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type {
  Application,
  ApplicationPayload,
  ApplicationStatus,
  WorkMode,
} from '../types';
import { statusConfig } from '../constants/application-status';

const props = defineProps<{
  modelValue: boolean;
  application?: Application | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', payload: ApplicationPayload, id: string | null): void;
}>();

interface ApplicationForm {
  company: string;
  role: string;
  url: string;
  status: ApplicationStatus;
  workMode: WorkMode | '';
  salary: number | undefined;
  notes: string;
}

const emptyForm = (): ApplicationForm => ({
  company: '',
  role: '',
  url: '',
  status: 'APPLIED',
  workMode: '',
  salary: undefined,
  notes: '',
});

function formFromApplication(app: Application): ApplicationForm {
  return {
    company: app.company,
    role: app.role,
    url: app.url ?? '',
    status: app.status,
    workMode: app.workMode ?? '',
    salary: app.salary ?? undefined,
    notes: app.notes ?? '',
  };
}

const form = ref<ApplicationForm>(emptyForm());

const isEditing = computed(() => !!props.application);
const canSubmit = computed(
  () => form.value.company.trim() !== '' && form.value.role.trim() !== '',
);

// El formulario se carga al abrir (no al cerrar), así no parpadea
// el contenido durante la animación de salida.
watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    form.value = props.application
      ? formFromApplication(props.application)
      : emptyForm();
  },
  { immediate: true },
);

function close() {
  emit('update:modelValue', false);
}

function submit() {
  if (!canSubmit.value) return;

  emit(
    'save',
    {
      company: form.value.company.trim(),
      role: form.value.role.trim(),
      url: form.value.url || undefined,
      status: form.value.status,
      workMode: form.value.workMode || undefined,
      salary: form.value.salary || undefined,
      notes: form.value.notes || undefined,
    },
    props.application?.id ?? null,
  );
}
</script>

<style scoped>
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  display: inline-block;
  vertical-align: middle;
  line-height: 1;
  font-size: 20px;
}

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

.modal-close {
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

.modal-close:hover {
  background: var(--border-light);
  color: #3525cd;
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

.field label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.field input,
.field select,
.field textarea {
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

.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color: #3525cd;
  box-shadow: 0 0 0 3px rgba(53, 37, 205, 0.1);
  background: var(--bg-card);
}

.field textarea {
  resize: vertical;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-light);
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

.btn-confirm:hover:not(:disabled) {
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

/* Transitions */
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
</style>