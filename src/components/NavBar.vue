<template>
  <nav class="navbar" :class="{ dark: darkMode }">
    <div class="logo">📷 旅行日记</div>
    <div class="nav-right">
      <div class="layout-switch">
        <button
          :class="{ active: currentLayout === 'grid' }"
          @click="$emit('switch-layout', 'grid')"
        >瀑布流</button>
        <button
          :class="{ active: currentLayout === 'scatter' }"
          @click="$emit('switch-layout', 'scatter')"
        >随机漂浮</button>
      </div>
      <button class="theme-btn" @click="$emit('toggle-dark')">
        {{ darkMode ? '☀️' : '🌙' }}
      </button>
      <button class="login-btn">登录</button>
    </div>
  </nav>
</template>

<script setup>
defineProps({
  currentLayout: String,
  darkMode: Boolean
})
defineEmits(['switch-layout', 'toggle-dark'])
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: background 0.5s, box-shadow 0.5s;
}
.navbar.dark {
  background: rgba(30, 26, 22, 0.9);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}
.logo {
  font-size: 22px;
  font-weight: 700;
  color: #2c3e50;
  transition: color 0.5s;
}
.navbar.dark .logo {
  color: #e8d5b7;
}
.nav-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.layout-switch {
  display: flex;
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  transition: background 0.5s;
}
.navbar.dark .layout-switch {
  background: #3a332a;
}
.layout-switch button {
  padding: 8px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.3s;
}
.navbar.dark .layout-switch button {
  color: #a09080;
}
.layout-switch button.active {
  background: #3498db;
  color: #fff;
}
.theme-btn {
  padding: 8px 12px;
  background: #f0f0f0;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.3s;
}
.navbar.dark .theme-btn {
  background: #3a332a;
}
.theme-btn:hover {
  background: #e0e0e0;
}
.navbar.dark .theme-btn:hover {
  background: #4a433a;
}
.login-btn {
  padding: 8px 24px;
  background: #3498db;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}
.login-btn:hover {
  background: #2980b9;
}
</style>
