<template>
  <div class="login-page">
    <!-- 背景漂浮光点 -->
    <div class="bg-orb orb-1"></div>
    <div class="bg-orb orb-2"></div>
    <div class="bg-orb orb-3"></div>

    <div class="login-content">
      <div class="brand">
        <h1>拾光</h1>
        <p class="tagline">记录值得被记住的瞬间</p>
      </div>

      <div class="login-card">
        <div class="tabs">
          <button :class="{ active: mode === 'login' }" @click="mode = 'login'">登录</button>
          <button :class="{ active: mode === 'register' }" @click="mode = 'register'">注册</button>
        </div>

        <form @submit.prevent="submit">
          <div class="form-group">
            <input v-model="username" placeholder="用户名" autocomplete="username" />
          </div>
          <div class="form-group">
            <input v-model="password" type="password" placeholder="密码" autocomplete="current-password" />
          </div>
          <p v-if="error" class="error">{{ error }}</p>
          <button type="submit" class="submit-btn" :disabled="loading">
            {{ loading ? '请稍候...' : (mode === 'login' ? '登录' : '注册') }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { api } from '../api'

const emit = defineEmits(['login-success'])

const mode = ref('login')
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const fn = mode.value === 'login' ? api.login : api.register
    const data = await fn(username.value, password.value)
    localStorage.setItem('token', data.token)
    emit('login-success', data.user)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-gradient);
  transition: background 0.5s;
  position: relative;
  overflow: hidden;
}

/* 漂浮光点 */
.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
}
.orb-1 {
  width: 400px; height: 400px;
  background: rgba(201, 133, 77, 0.1);
  top: 15%; right: 10%;
  animation: orbFloat 18s ease-in-out infinite;
}
.orb-2 {
  width: 300px; height: 300px;
  background: rgba(212, 160, 106, 0.08);
  bottom: 20%; left: 5%;
  animation: orbFloat 22s ease-in-out infinite reverse;
}
.orb-3 {
  width: 250px; height: 250px;
  background: rgba(184, 115, 57, 0.06);
  top: 60%; right: 30%;
  animation: orbFloat 15s ease-in-out infinite 3s;
}

@keyframes orbFloat {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(30px, -40px) scale(1.05); }
  50% { transform: translate(-20px, 20px) scale(0.95); }
  75% { transform: translate(40px, 30px) scale(1.02); }
}

.login-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 36px;
  z-index: 1;
  animation: contentFadeIn 0.8s ease;
}

@keyframes contentFadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.brand {
  text-align: center;
}
.brand h1 {
  font-size: clamp(40px, 7vw, 56px);
  font-weight: 200;
  font-family: var(--font-serif);
  color: var(--text);
  letter-spacing: 0.15em;
  margin: 0 0 16px;
}
.tagline {
  color: var(--text-muted);
  font-size: var(--text-base);
  letter-spacing: 0.1em;
  font-weight: 300;
  font-family: var(--font-serif);
}

.login-card {
  background: var(--surface);
  backdrop-filter: blur(24px) saturate(1.2);
  -webkit-backdrop-filter: blur(24px) saturate(1.2);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: 36px 36px;
  width: 340px;
  max-width: 92%;
  box-shadow: var(--shadow-lg);
  transition: background 0.5s, border-color 0.5s;
}

.tabs {
  display: flex;
  background: var(--input-bg);
  border-radius: var(--radius-sm);
  overflow: hidden;
  margin-bottom: 28px;
  border: 1px solid var(--border);
}
.tabs button {
  flex: 1;
  padding: 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-muted);
  transition: all 0.3s;
  letter-spacing: 0.04em;
}
.tabs button.active {
  background: var(--accent);
  color: #fff;
  border-radius: var(--radius-sm);
}

.form-group {
  margin-bottom: 16px;
}
input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--input-border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  background: var(--input-bg);
  color: var(--text);
  transition: border-color 0.3s, box-shadow 0.3s;
  box-sizing: border-box;
  letter-spacing: 0.02em;
}
input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}
input::placeholder {
  color: var(--text-muted);
}

.error {
  color: var(--error);
  font-size: 13px;
  margin: 0 0 12px;
  text-align: center;
}
.submit-btn {
  width: 100%;
  padding: 13px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 16px var(--accent-glow);
  letter-spacing: 0.06em;
  margin-top: 4px;
}
.submit-btn:hover {
  background: var(--accent-hover);
  box-shadow: 0 4px 24px var(--accent-glow);
  transform: translateY(-1px);
}
.submit-btn:active {
  transform: translateY(0);
}
.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
</style>
