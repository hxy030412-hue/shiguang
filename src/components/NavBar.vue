<template>
  <nav class="navbar">
    <router-link to="/" class="logo">拾光</router-link>
    <div class="nav-links">
      <router-link to="/" class="nav-link" active-class="active" exact>回忆馆</router-link>
      <router-link to="/map" class="nav-link" active-class="active">人生地图</router-link>
      <router-link to="/timebox" class="nav-link" active-class="active">时光盒</router-link>
      <router-link to="/settings" class="nav-link" active-class="active">设置</router-link>
    </div>
    <button class="add-btn" @click="$emit('add-photo')">+</button>
    <div class="nav-right">
      <button class="theme-btn" @click="$emit('toggle-dark')">
        {{ darkMode ? '☀' : '☾' }}
      </button>
      <div class="user-info">
        <div class="nav-avatar">
          <img v-if="user?.avatar" :src="user.avatar" alt="头像" />
          <div v-else class="nav-avatar-placeholder">{{ (user?.nickname || user?.username || '?').charAt(0) }}</div>
        </div>
        <span class="username">{{ user?.nickname || user?.username }}</span>
      </div>
      <button class="logout-btn" @click="$emit('logout')">退出</button>
    </div>
  </nav>
</template>

<script setup>
defineProps({
  darkMode: Boolean,
  user: Object
})
defineEmits(['toggle-dark', 'logout', 'add-photo'])
</script>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  padding: 0 32px;
  height: 64px;
  background: var(--surface);
  backdrop-filter: blur(20px) saturate(1.2);
  -webkit-backdrop-filter: blur(20px) saturate(1.2);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  box-shadow: var(--shadow-sm);
  border-bottom: 1px solid var(--glass-border);
  transition: background 0.5s, box-shadow 0.5s;
}

.logo {
  font-size: 18px;
  font-weight: 400;
  color: var(--text);
  text-decoration: none;
  letter-spacing: var(--tracking-wider);
  font-family: var(--font-serif);
  transition: color 0.5s;
}

.nav-links {
  display: flex;
  gap: 4px;
  margin-left: 48px;
}
.nav-link {
  padding: 8px 18px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  font-size: 14px;
  color: var(--text-muted);
  transition: all 0.3s;
}
.nav-link:hover {
  background: var(--accent-glow);
  color: var(--text-secondary);
}
.nav-link.active {
  background: var(--accent);
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
  background: var(--input-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s;
}
.theme-btn:hover {
  background: var(--accent-glow);
  border-color: var(--accent);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.nav-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--input-bg);
  border: 1.5px solid var(--border);
  flex-shrink: 0;
  transition: border-color 0.3s;
}
.nav-avatar:hover {
  border-color: var(--accent);
}
.nav-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.nav-avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  font-family: var(--font-serif);
}
.username {
  font-size: 14px;
  color: var(--text-secondary);
}
.logout-btn {
  padding: 6px 14px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-muted);
  transition: all 0.3s;
}
.logout-btn:hover {
  border-color: var(--error);
  color: var(--error);
}

.add-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  border: none;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.3s, transform 0.2s, box-shadow 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 12px var(--accent-glow);
}
.add-btn:hover {
  background: var(--accent-hover);
  transform: scale(1.1);
  box-shadow: 0 4px 20px var(--accent-glow);
}
</style>
