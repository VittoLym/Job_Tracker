
<template>
  <div
    class="toast-container"
    aria-live="polite"
    aria-relevant="additions"
  >
    <TransitionGroup
      name="toast"
      tag="div"
      class="toast-list"
    >
      <ToastNotification
        v-for="toast in store.toasts"
        :key="toast.id"
        :toast="toast"
        @dismiss="store.dismissToast(toast.id)"
      />
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToastStore } from '../stores/toast.store';
import ToastNotification from './ToastNotification.vue';

const store = useToastStore();
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  width: min(380px, calc(100vw - 40px));
  pointer-events: none;
}

.toast-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast-list > * {
  pointer-events: auto;
}

.toast-enter-active,
.toast-leave-active,
.toast-move {
  transition: all 0.25s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.toast-leave-active {
  position: absolute;
  width: 100%;
}

@media (max-width: 480px) {
  .toast-container {
    top: 12px;
    left: 12px;
    width: calc(100vw - 24px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active,
  .toast-move {
    transition: none;
  }
}
</style>
