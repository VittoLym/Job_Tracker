
<template>
  <article
    class="toast"
    :class="`toast--${toast.type}`"
    role="status"
  >
    <div class="toast-icon">
      <span class="material-symbols-outlined">
        {{ icons[toast.type] }}
      </span>
    </div>

    <div class="toast-content">
      <h4>{{ toast.title }}</h4>
      <p>{{ toast.message }}</p>
    </div>

    <button
      type="button"
      class="toast-close"
      aria-label="Cerrar notificación"
      @click="$emit('dismiss')"
    >
      <span class="material-symbols-outlined">close</span>
    </button>
  </article>
</template>

<script setup lang="ts">
import type { ToastMessage } from '../stores/toast.store';

defineProps<{
  toast: ToastMessage;
}>();

defineEmits<{
  (e: 'dismiss'): void;
}>();

const icons = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
};
</script>

<style scoped>
.toast {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 16px;
  border: 1px solid var(--border-light);
  border-left: 3px solid;
  border-radius: 12px;
  background: var(--bg-card);
  box-shadow: 0 8px 28px var(--shadow-color);
  color: var(--text-primary);
}

.toast--success {
  border-left-color: #16a34a;
}

.toast--error {
  border-left-color: #dc2626;
}

.toast--warning {
  border-left-color: #d97706;
}

.toast--info {
  border-left-color: #3525cd;
}

.toast-icon {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
}

.toast--success .toast-icon {
  color: #16a34a;
}

.toast--error .toast-icon {
  color: #dc2626;
}

.toast--warning .toast-icon {
  color: #d97706;
}

.toast--info .toast-icon {
  color: #3525cd;
}

.toast-icon .material-symbols-outlined {
  font-size: 22px;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-content h4 {
  margin: 0 0 5px;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.toast-content p {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-secondary);
  overflow-wrap: anywhere;
}

.toast-close {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 4px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: background 0.15s ease;
}

.toast-close:hover {
  background: var(--border-light);
  color: var(--text-primary);
}

.toast-close .material-symbols-outlined {
  font-size: 18px;
}

@media (max-width: 480px) {
  .toast {
    padding: 13px;
    gap: 10px;
  }
}
</style>
