<template>
  <div class="app">
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
      </div>
    </aside>

    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #fcf8ff;
  color: #1b1b24;
  overflow: hidden;
}

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  display: inline-block;
  vertical-align: middle;
  line-height: 1;
  font-size: 20px;
}

.app {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  width: 240px;
  background: #0f0e1b;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 20px 12px;
  border-right: 1px solid rgba(255,255,255,0.06);
}

.sidebar-top { display: flex; flex-direction: column; gap: 24px; }
.sidebar-bottom { display: flex; flex-direction: column; gap: 4px; }

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

/* Nav */
.nav { display: flex; flex-direction: column; gap: 2px; }

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255,255,255,0.5);
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}

.nav-item:hover {
  background: rgba(255,255,255,0.07);
  color: #fff;
}

.nav-item.router-link-active {
  background: #3525cd;
  color: #fff;
  box-shadow: 0 2px 12px rgba(53,37,205,0.35);
}

.nav-item.muted {
  color: rgba(255,255,255,0.35);
}

.nav-item.muted:hover {
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.6);
}

/* Main content */
.content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Dashboard necesita padding y scroll */
.content > .dashboard {
  padding: 32px;
  overflow-y: auto;
  height: 100%;
}

/* Applications ocupa todo sin padding (lo maneja la vista) */
.content > .applications-page {
  height: 100%;
  overflow: hidden;
}
</style>