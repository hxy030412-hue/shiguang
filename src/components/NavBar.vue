<template>
  <nav class="navbar">
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
      <button class="login-btn">登录</button>
    </div>
  </nav>
</template>

<script setup>
defineProps({
  currentLayout: String
})
defineEmits(['switch-layout'])
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
}
.logo {
  font-size: 22px;
  font-weight: 700;
  color: #2c3e50;
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
.layout-switch button.active {
  background: #3498db;
  color: #fff;
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
