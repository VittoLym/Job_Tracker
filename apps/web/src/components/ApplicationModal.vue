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
import { useToastStore } from '@/stores/toast.store';

const toast = useToastStore() 
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
  toast.showToast({
    type: 'success',
    title: 'Postulación Creada con Exito.',
    message:
      'La postulación ha sido creada con exito.',
  });
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

/* Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--modal-overlay);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  overflow-y: auto;
}

/* Modal container */
.modal {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 520px;
  max-height: min(90vh, 760px);
  max-height: min(90dvh, 760px);
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  box-shadow: 0 24px 64px var(--shadow-color);
  overflow: hidden;
}

/* Header */
.modal-header {
  display: flex;
  flex: 0 0 auto;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-secondary);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
}

.modal-close {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 6px;
  border: none;
  border-radius: 99px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.modal-close:hover {
  background: var(--border-light);
  color: #3525cd;
}

.modal-close:focus-visible,
.btn-confirm:focus-visible,
.btn-ghost:focus-visible {
  outline: 2px solid #3525cd;
  outline-offset: 3px;
}

/* Form layout */
.modal form {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.modal-body {
  flex: 1 1 auto;
  min-height: 0;
  padding: 24px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) transparent;
}

.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-thumb {
  border-radius: 99px;
  background: var(--border-color);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 16px;
}

.field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 7px;
}

.field.full {
  grid-column: 1 / -1;
}

.field label {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 11px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  outline: none;
  background: var(--bg-input);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 14px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease,
    background 0.15s ease;
}

.field input::placeholder,
.field textarea::placeholder {
  color: var(--text-muted);
  opacity: 0.7;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color: #3525cd;
  box-shadow: 0 0 0 3px rgba(53, 37, 205, 0.12);
  background: var(--bg-card);
}

.field select {
  cursor: pointer;
}

.field textarea {
  min-height: 90px;
  resize: vertical;
  line-height: 1.5;
}

/* Footer */
.modal-footer {
  display: flex;
  flex: 0 0 auto;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-light);
  background: var(--bg-card);
}

.btn-confirm,
.btn-ghost {
  min-height: 40px;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s ease, box-shadow 0.15s ease,
    opacity 0.15s ease;
}

.btn-confirm {
  padding: 9px 18px;
  border: none;
  background: #3525cd;
  color: #fff;
  font-weight: 600;
}

.btn-confirm:hover:not(:disabled) {
  background: #4f46e5;
  box-shadow: 0 4px 16px rgba(53, 37, 205, 0.3);
}

.btn-confirm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-ghost {
  padding: 9px 18px;
  border: 1px solid var(--border-light);
  background: transparent;
  color: var(--text-muted);
  font-weight: 700;
}

.btn-ghost:hover {
  background: var(--bg-secondary);
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.15s ease;
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: scale(0.97) translateY(8px);
}

/* Tablet */
@media (max-width: 640px) {
  .modal-overlay {
    padding: 16px;
  }

  .modal {
    max-width: 480px;
    max-height: 92vh;
    max-height: 92dvh;
  }

  .modal-header {
    padding: 18px 20px;
  }

  .modal-body {
    padding: 20px;
  }

  .modal-footer {
    padding: 14px 20px;
  }

  .form-grid {
    gap: 16px 12px;
  }
}

/* Mobile */
@media (max-width: 480px) {
  .modal-overlay {
    align-items: center;
    padding: 12px;
  }

  .modal {
    width: 100%;
    max-width: none;
    max-height: 94vh;
    max-height: 94dvh;
    border-radius: 14px;
  }

  .modal-header {
    padding: 16px;
  }

  .modal-header h3 {
    font-size: 16px;
  }

  .modal-body {
    padding: 18px 16px;
  }

  .form-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }

  .field.full {
    grid-column: auto;
  }

  .field input,
  .field select,
  .field textarea {
    padding: 12px;
    font-size: 16px;
  }

  .modal-footer {
    padding: 14px 16px;
    gap: 8px;
  }

  .btn-confirm,
  .btn-ghost {
    flex: 1;
    min-height: 44px;
    padding: 10px 12px;
  }
}

/* Mobile with limited vertical space */
@media (max-width: 480px) and (max-height: 650px) {
  .modal-overlay {
    align-items: flex-start;
    padding: 8px;
  }

  .modal {
    max-height: calc(100vh - 16px);
    max-height: calc(100dvh - 16px);
  }

  .modal-header {
    padding: 12px 16px;
  }

  .modal-body {
    padding: 14px 16px;
  }

  .form-grid {
    gap: 12px;
  }

  .modal-footer {
    padding: 10px 16px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active,
  .modal-enter-active .modal,
  .modal-leave-active .modal {
    transition: none;
  }
}

</style>