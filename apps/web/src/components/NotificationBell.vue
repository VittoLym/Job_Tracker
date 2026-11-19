
<template>
  <div
    ref="container"
    class="notification-container"
  >
    <button
      class="notification-trigger"
      type="button"
      :aria-expanded="isOpen"
      aria-label="Notificaciones"
      @click="togglePanel"
    >
      <span class="material-symbols-outlined">notifications</span>
      <span class="notification-label">Notificaciones</span>
      <span
        v-if="store.count > 0"
        class="notification-badge"
      >
        {{ store.count > 99 ? '99+' : store.count }}
      </span>
    </button>

    <Transition name="notification">
      <section
        v-if="isOpen"
        class="notification-panel"
        aria-label="Centro de notificaciones"
      >
        <header class="panel-header">
          <div>
            <h2>Notificaciones</h2>
            <p>{{ store.count }} notificaciones</p>
          </div>

          <button
            class="icon-button"
            type="button"
            aria-label="Actualizar"
            title="Actualizar"
            :disabled="store.loading"
            @click="store.fetchAll()"
          >
            <span
              class="material-symbols-outlined"
              :class="{ spinning: store.loading }"
            >
              refresh
            </span>
          </button>
        </header>

        <div class="notification-list">
          <div
            v-if="store.loading && !store.notifications.length"
            class="panel-state"
          >
            <span class="material-symbols-outlined spinning">progress_activity</span>
            <p>Cargando notificaciones...</p>
          </div>

          <div
            v-else-if="store.error"
            class="panel-state error"
          >
            <span class="material-symbols-outlined">error</span>
            <p>{{ store.error }}</p>
            <button
              type="button"
              @click="store.fetchAll()"
            >
              Reintentar
            </button>
          </div>

          <div
            v-else-if="!store.notifications.length"
            class="panel-state"
          >
            <span class="material-symbols-outlined empty-icon">
              notifications_off
            </span>
            <p>No tenés notificaciones todavía.</p>
          </div>

          <article
            v-for="notification in store.notifications"
            v-else
            :key="notification.id"
            class="notification-item"
          >
            <div class="notification-icon">
              <span class="material-symbols-outlined">
                swap_horiz
              </span>
            </div>

            <div class="notification-content">
              <div class="notification-title">
                <strong>{{ notification.payload.company }}</strong>
                <time :datetime="notification.createdAt">
                  {{ formatDate(notification.createdAt) }}
                </time>
              </div>

              <p class="notification-role">
                {{ notification.payload.role }}
              </p>

              <div class="status-change">
                <span :class="['status', statusClass(notification.payload.fromStatus)]">
                  {{ formatStatus(notification.payload.fromStatus) }}
                </span>

                <span class="material-symbols-outlined arrow">
                  arrow_forward
                </span>

                <span :class="['status', statusClass(notification.payload.toStatus)]">
                  {{ formatStatus(notification.payload.toStatus) }}
                </span>
              </div>

              <button
                class="view-application"
                type="button"
                @click="goToApplications"
              >
                Ver postulaciones
                <span class="material-symbols-outlined">arrow_outward</span>
              </button>
            </div>
          </article>
        </div>

        <footer
          v-if="store.notifications.length"
          class="panel-footer"
        >
          <span>Mostrando {{ store.count }} notificaciones</span>
        </footer>
      </section>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNotificationsStore } from '../stores/notifications.store';
import type { ApplicationStatus } from '../types';

const store = useNotificationsStore();
const router = useRouter();

const isOpen = ref(false);
const container = ref<HTMLElement | null>(null);

function togglePanel() {
  isOpen.value = !isOpen.value;

  if (isOpen.value) {
    void store.fetchAll();
  }
}

function handleOutsideClick(event: MouseEvent) {
  if (
    container.value &&
    !container.value.contains(event.target as Node)
  ) {
    isOpen.value = false;
  }
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    isOpen.value = false;
  }
}

function goToApplications() {
  isOpen.value = false;
  void router.push('/applications');
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function formatStatus(status: ApplicationStatus | null): string {
  if (!status) return 'Nueva';

  const labels: Record<ApplicationStatus, string> = {
    APPLIED: 'Postulado',
    ASSESSMENT: 'Evaluación',
    INTERVIEW: 'Entrevista',
    OFFER: 'Oferta',
    REJECTED: 'Rechazado',
    GHOSTED: 'Sin respuesta',
  };

  return labels[status];
}

function statusClass(status: ApplicationStatus | null): string {
  return status ? status.toLowerCase() : 'new';
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick);
  document.addEventListener('keydown', handleEscape);
});

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick);
  document.removeEventListener('keydown', handleEscape);
});
</script>

<style scoped>
.notification-container {
  position: relative;
  width: 100%;
}

.notification-trigger {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--sidebar-text);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.notification-trigger:hover {
  background: rgba(255, 255, 255, 0.07);
  color: white;
}
.notification-label {
  font-size: 14px;
  font-weight: 500;
}

.notification-badge {
  margin-left: auto;
}

.notification-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 19px;
  height: 19px;
  padding: 0 5px;
  border-radius: 20px;
  background: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 700;
}

.notification-panel {
  position: absolute;
  z-index: 1000;
  top: -5px;
  left: calc(100% + 12px);
  width: 360px;
  max-width: calc(100vw - 280px);
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 14px;
  background: var(--bg-app);
  color: var(--text-primary);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px;
  border-bottom: 1px solid var(--border-color);
}

.panel-header h2 {
  font-size: 15px;
  font-weight: 700;
}

.panel-header p,
.panel-footer {
  margin-top: 4px;
  color: var(--text-secondary);
  font-size: 11px;
}

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
}

.icon-button:hover {
  color: var(--text-primary);
  background: var(--shadow-color);
}

.icon-button:disabled {
  cursor: wait;
  opacity: 0.5;
}

.notification-list {
  max-height: 420px;
  overflow-y: auto;
}

.panel-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 170px;
  padding: 24px;
  color: var(--text-secondary);
  font-size: 12px;
  text-align: center;
}

.panel-state .material-symbols-outlined {
  font-size: 28px;
}

.panel-state.error {
  color: #ef4444;
}

.panel-state button {
  padding: 7px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
}

.empty-icon {
  opacity: 0.5;
}

.notification-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  transition: background 0.2s;
}

.notification-item:hover {
  background: var(--shadow-color);
}

.notification-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: rgba(99, 102, 241, 0.12);
  color: #818cf8;
}

.notification-content {
  min-width: 0;
  flex: 1;
}

.notification-title {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.notification-title strong {
  font-size: 12px;
}

.notification-title time {
  flex-shrink: 0;
  color: var(--text-secondary);
  font-size: 10px;
}

.notification-role {
  margin-top: 4px;
  color: var(--text-secondary);
  font-size: 11px;
}

.status-change {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.status {
  padding: 4px 7px;
  border-radius: 5px;
  background: var(--shadow-color);
  font-size: 9px;
  font-weight: 700;
}

.status.applied,
.status.new {
  color: #60a5fa;
}

.status.assessment {
  color: #c084fc;
}

.status.interview {
  color: #fbbf24;
}

.status.offer {
  color: #34d399;
}

.status.rejected,
.status.ghosted {
  color: #f87171;
}

.arrow {
  color: var(--text-secondary);
  font-size: 14px;
}

.view-application {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 11px;
  padding: 0;
  border: none;
  background: transparent;
  color: #818cf8;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
}

.view-application:hover {
  color: #a5b4fc;
}

.view-application .material-symbols-outlined {
  font-size: 13px;
}

.panel-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);
}

.spinning {
  animation: spin 1s linear infinite;
}

.notification-enter-active,
.notification-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .notification-trigger {
    justify-content: center;
    padding: 10px;
  }

  .notification-label {
    display: none;
  }

  .notification-badge {
    position: absolute;
    top: 2px;
    right: 2px;
    min-width: 16px;
    height: 16px;
    padding: 0 3px;
    font-size: 9px;
  }

  .notification-panel {
    position: fixed;
    top: 90px;
    left: 84px;
    width: 340px;
    max-width: calc(100vw - 100px);
  }
}

@media (max-width: 480px) {
  .notification-panel {
    left: 64px;
    max-width: calc(100vw - 76px);
  }
}
</style>
