
<template>
  <div
    class="app"
    :class="{ dark: isDark }"
  >
    <aside class="sidebar">
      <div class="sidebar-top">
        <div class="logo">
          <div class="logo-icon">
            <span class="material-symbols-outlined">work</span>
          </div>
          <span class="logo-text">Job Tracker</span>
        </div>

        <nav class="nav">
          <RouterLink
            to="/dashboard"
            class="nav-item"
          >
            <span class="material-symbols-outlined">grid_view</span>
            <span>Dashboard</span>
          </RouterLink>

          <RouterLink
            to="/applications"
            class="nav-item"
          >
            <span class="material-symbols-outlined">work</span>
            <span>Applications</span>
          </RouterLink>
          <NotificationBell />
        </nav>
      </div>

      <div class="sidebar-bottom">
        <div class="nav-item muted">
          <span class="material-symbols-outlined">settings</span>
          <span>Settings</span>
        </div>

        <button
          class="theme-toggle"
          type="button"
          :aria-label="isDark ? 'Activar tema claro' : 'Activar tema oscuro'"
          @click="toggleTheme"
        >
          <span class="material-symbols-outlined">
            {{ isDark ? 'light_mode' : 'dark_mode' }}
          </span>
        </button>
      </div>
    </aside>

    <main class="content">
      <RouterView v-slot="{ Component }">
        <component
          :is="Component"
          @new-application="goToNewApplication"
          @view-applications="goToApplications"
        />
      </RouterView>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { RouterLink, RouterView, useRouter } from 'vue-router';
import { useNotificationsStore } from './stores/notifications.store';
import NotificationBell from './components/NotificationBell.vue';

const isDark = ref(false);
const router = useRouter();
const notificationsStore = useNotificationsStore();

let notificationsInterval: number | null = null;
let mediaQuery: MediaQueryList | null = null;

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark);
}

function toggleTheme() {
  isDark.value = !isDark.value;

  localStorage.setItem(
    'theme',
    isDark.value ? 'dark' : 'light',
  );
}

watch(isDark, (dark) => {
  applyTheme(dark);
});

function handleSystemThemeChange(event: MediaQueryListEvent) {
  if (localStorage.getItem('theme')) return;

  isDark.value = event.matches;
}

onMounted(() => {
  // Tema
  const savedTheme = localStorage.getItem('theme');

  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  isDark.value = savedTheme
    ? savedTheme === 'dark'
    : mediaQuery.matches;

  mediaQuery.addEventListener('change', handleSystemThemeChange);

  // Notificaciones: carga inicial
  void notificationsStore.fetchAll();

  // Sincronización periódica cada 30 segundos
  notificationsInterval = window.setInterval(() => {
    void notificationsStore.fetchAll();
  }, 30_000);
});

onUnmounted(() => {
  mediaQuery?.removeEventListener('change', handleSystemThemeChange);

  if (notificationsInterval !== null) {
    window.clearInterval(notificationsInterval);
  }
});
function goToApplications() {
  void router.push({ name: 'applications' });
}

function goToNewApplication() {
  void router.push({ name: 'applications', query: { new: '1' } });
}
</script>


<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

/* ===== Variables Globales ===== */
:root {
    /* Light mode */
  --bg-app: #fcf8ff;
  --bg-content: #ffffff;
  --text-primary: #1b1b24;
  --text-secondary: #777587;
  --border-color: #e4e1ee;
  --shadow-color: rgba(0, 0, 0, 0.05);

    /* Light mode - Sidebar */
  --sidebar-bg: #EEEAFB;
  --sidebar-text: #514B68;
  --sidebar-text-hover: #3525CD;
  --sidebar-active-bg: #3525CD;
  --sidebar-active-text: #FFFFFF;
  --sidebar-muted: #8C85A3;
  --sidebar-border: #DDD6F0;
}

html.dark {
  --bg-app: #0d1117;
  --bg-content: #161b22;
  --text-primary: #e6edf3;
  --text-secondary: #8b949e;
  --border-color: #30363d;
  --shadow-color: rgba(0, 0, 0, 0.25);

  /* Sidebar (siempre oscuro, con variantes) */
  --sidebar-bg: #090812;
  --sidebar-text: rgba(255, 255, 255, 0.55);
  --sidebar-text-hover: #ffffff;
  --sidebar-active-bg: #5145e5;
  --sidebar-active-text: #ffffff;
  --sidebar-muted: rgba(255, 255, 255, 0.35);
}

/* ===== Reset ===== */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--bg-app);
  color: var(--text-primary);
  overflow: hidden;
  transition: all 0.2s ease;
}

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  display: inline-block;
  vertical-align: middle;
  line-height: 1;
  font-size: 20px;
}

/* ===== App Layout ===== */
.app {
  display: flex;
  height: 100dvh;
  overflow: hidden;
  background: var(--bg-app);
  transition: all 0.2s ease;
}

/* ===== Sidebar ===== */
.sidebar {
  width: 240px;
  background: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 20px 12px;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}

.sidebar-top {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sidebar-bottom {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
}

/* ===== Logo ===== */
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: #3525cd;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-icon .material-symbols-outlined {
  color: #fff;
  font-size: 18px !important;
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.3px;
}

/* ===== Theme Toggle en Sidebar ===== */
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--sidebar-border);
  border-radius: 8px;
  background: var(--text-primary);
  color: var(--bg-app);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.theme-toggle:hover {
  background: var(--sidebar-bg);
  color: var(--sidebar-text-hover);
  transform: scale(1.05);
}

.theme-toggle .material-symbols-outlined {
  font-size: 22px;
}

/* ===== Navigation ===== */
.nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--sidebar-text);
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}

.nav-item:hover {
  background: var(--sidebar-bg);
  color: var(--sidebar-text-hover);
}

.nav-item.router-link-active {
  background: var(--sidebar-active-bg);
  color: var(--sidebar-active-text);
  box-shadow: 0 2px 12px rgba(53, 37, 205, 0.35);
}


/* ===== Main Content ===== */
.content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--bg-content);
  transition: all 0.2s ease;
}

/* ===== Scrollbar ===== */
.content::-webkit-scrollbar,
.dashboard::-webkit-scrollbar,
.table-wrap::-webkit-scrollbar {
  width: 6px;
}

.content::-webkit-scrollbar-track,
.dashboard::-webkit-scrollbar-track,
.table-wrap::-webkit-scrollbar-track {
  background: transparent;
}

.content::-webkit-scrollbar-thumb,
.dashboard::-webkit-scrollbar-thumb,
.table-wrap::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.content::-webkit-scrollbar-thumb:hover,
.dashboard::-webkit-scrollbar-thumb:hover,
.table-wrap::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
  .sidebar {
    width: 72px;
    padding: 16px 8px;
  }

  .logo-text {
    display: none;
  }

  .logo {
    justify-content: center;
    padding: 4px 0;
  }

  .nav-item span:not(.material-symbols-outlined) {
    display: none;
  }

  .nav-item {
    justify-content: center;
    padding: 10px;
  }

  .sidebar-bottom {
    flex-direction: column;
    gap: 8px;
  }

  .theme-toggle {
    width: 40px;
    height: 40px;
  }

  .nav-item.muted {
    justify-content: center;
  }

  .content>.dashboard {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .sidebar {
    width: 56px;
    padding: 12px 4px;
  }

  .nav-item {
    padding: 8px;
  }

  .nav-item .material-symbols-outlined {
    font-size: 18px !important;
  }

  .theme-toggle {
    width: 36px;
    height: 36px;
  }

  .theme-toggle .material-symbols-outlined {
    font-size: 18px;
  }

  .content>.dashboard {
    padding: 12px;
  }
}
</style>