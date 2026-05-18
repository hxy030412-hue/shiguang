<template>
  <nav class="navbar" :class="{ dark: darkMode }">
    <router-link to="/" class="logo">📷 旅行日记</router-link>
    <div class="nav-links">
      <router-link to="/" class="nav-link" active-class="active" exact>首页</router-link>
      <router-link to="/map" class="nav-link" active-class="active">足迹地图</router-link>
      <router-link to="/settings" class="nav-link" active-class="active">设置</router-link>
    </div>
    <div class="nav-right">
      <button class="theme-btn" @click="$emit('toggle-dark')">
        {{ darkMode ? '☀️' : '🌙' }}
      </button>
      <div class="user-info">
        <span class="username">{{ user?.nickname || user?.username }}</span>
        <button class="logout-btn" @click="$emit('logout')">退出</button>
      </div>
    </div>
  </nav>
</template>

<script setup>
defineProps({
  darkMode: Boolean,
  user: Object
})
defineEmits(['toggle-dark', 'logout'])
</script>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  padding: 0 32px;
  height: 64px;
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
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
  text-decoration: none;
  transition: color 0.5s;
}
.navbar.dark .logo {
  color: #e8d5b7;
}

.nav-links {
  display: flex;
  gap: 8px;
  margin-left: 48px;
}
.nav-link {
  padding: 8px 18px;
  border-radius: 8px;
  text-decoration: none;
  font-size: 14px;
  color: #666;
  transition: all 0.3s;
}
.navbar.dark .nav-link {
  color: #a09080;
}
.nav-link:hover {
  background: rgba(0,0,0,0.05);
}
.navbar.dark .nav-link:hover {
  background: rgba(255,255,255,0.05);
}
.nav-link.active {
  background: #3498db;
  color: #fff;
}

.nav-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 16px;
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

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.username {
  font-size: 14px;
  color: #555;
}
.navbar.dark .username {
  color: #c0a888;
}
.logout-btn {
  padding: 6px 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: #888;
  transition: all 0.3s;
}
.navbar.dark .logout-btn {
  border-color: #3a332a;
  color: #a09080;
}
.logout-btn:hover {
  border-color: #e74c3c;
  color: #e74c3c;
}
</style>
