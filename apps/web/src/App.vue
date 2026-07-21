<template>
  <div class="app">
    <nav class="sidebar">
      <div class="logo">Job Tracker</div>
      <RouterLink to="/dashboard">Dashboard</RouterLink>
      <RouterLink to="/applications">Applications</RouterLink>
    </nav>
    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
</script>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f5f5f5;
  color: #1a1a1a;
}

.app {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  background: #1a1a1a;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.logo {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 24px;
  padding: 0 8px;
}

.sidebar a {
  color: #888;
  text-decoration: none;
  font-size: 14px;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.15s;
}

.sidebar a:hover { color: #fff; background: #2a2a2a; }
.sidebar a.router-link-active { color: #fff; background: #2a2a2a; }

.content {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
}
</style>