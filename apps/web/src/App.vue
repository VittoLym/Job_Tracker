<template>
  <div class="app" :class="{ dark: isDark }">
    <aside class="sidebar">
      <div class="sidebar-top">
        <div class="logo">
          <div class="logo-icon">
            <span class="material-symbols-outlined">work</span>
          </div>
          <span class="logo-text">Job Tracker</span>
        </div>

        <nav class="nav">
          <RouterLink to="/dashboard" class="nav-item">
            <span class="material-symbols-outlined">grid_view</span>
            <span>Dashboard</span>
          </RouterLink>
          <RouterLink to="/applications" class="nav-item">
            <span class="material-symbols-outlined">work</span>
            <span>Applications</span>
          </RouterLink>
        </nav>
      </div>

      <div class="sidebar-bottom">
        <div class="nav-item muted">
          <span class="material-symbols-outlined">settings</span>
          <span>Settings</span>
        </div>
        <button class="theme-toggle" @click="toggleTheme">
          <span class="material-symbols-outlined">
            {{ isDark ? 'light_mode' : 'dark_mode' }}
          </span>
        </button>
      </div>
    </aside>

    <main class="content">
      <RouterView />
    </main>
  </div>
</template>
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
const isDark = ref(false)
function toggleTheme() {
  isDark.value = !isDark.value;
  applyTheme(isDark.value);
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
  defineEmits()
}

function applyTheme(dark: boolean) {
  // ✅ Aplicar al HTML, NO al div del dashboard
  document.documentElement.classList.toggle('dark', dark);
}

// Watcher por si cambia desde otro lugar
watch(isDark, (val) => {
  applyTheme(val);
});
onMounted(() => {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  isDark.value = saved ? saved === 'dark' : prefersDark;
  applyTheme(isDark.value);
  
  // Escuchar cambios en el sistema
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e: MediaQueryListEvent) => {
    if (!localStorage.getItem('theme')) {
      isDark.value = e.matches;
      applyTheme(e.matches);
    }
  };
  mediaQuery.addEventListener('change', handler);
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

/* ===== Variables Globales ===== */
:root {
  /* Light mode */
  --bg-app: #fcf8ff;
  --bg-content: #fcf8ff;
  --text-primary: #1b1b24;
  --text-secondary: #777587;
  --border-color: #c7c4d8;
  --shadow-color: rgba(0, 0, 0, 0.05);
  
  /* Sidebar (siempre oscuro, pero con variantes) */
  --sidebar-bg: #0f0e1b;
  --sidebar-text: rgba(255, 255, 255, 0.5);
  --sidebar-text-hover: #ffffff;
  --sidebar-active-bg: #3525cd;
  --sidebar-active-text: #ffffff;
  --sidebar-muted: rgba(255, 255, 255, 0.35);
}

:global(html.dark) {
  --bg-app: #0d1117;
  --bg-content: #0d1117;
  --text-primary: #e6edf3;
  --text-secondary: #8b949e;
  --border-color: #30363d;
  --shadow-color: rgba(0, 0, 0, 0.3);
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
  transition: background 0.3s ease, color 0.3s ease;
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
  height: 100vh;
  overflow: hidden;
  background: var(--bg-app);
  transition: background 0.3s ease;
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
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  color: var(--sidebar-text);
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.theme-toggle:hover {
  background: rgba(255, 255, 255, 0.07);
  color: #fff;
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
  transition: all 0.2s;
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.07);
  color: var(--sidebar-text-hover);
}

.nav-item.router-link-active {
  background: var(--sidebar-active-bg);
  color: var(--sidebar-active-text);
  box-shadow: 0 2px 12px rgba(53, 37, 205, 0.35);
}

.nav-item.muted {
  color: var(--sidebar-muted);
}

.nav-item.muted:hover {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.6);
}

/* ===== Main Content ===== */
.content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--bg-content);
  transition: background 0.3s ease;
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

/* ===== Dashboard específico ===== */
.content>.dashboard {
  padding: 32px;
  overflow-y: auto;
  height: 100%;
  background: var(--bg-content);
}

/* ===== Applications específico ===== */
.content>.applications-page {
  height: 100%;
  overflow: hidden;
  background: var(--bg-content);
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