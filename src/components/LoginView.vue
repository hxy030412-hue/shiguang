<template>
  <div class="login-page">
    <div class="login-card">
      <h1>📷 拾光</h1>
      <p class="subtitle">收集生活中的每一束光</p>

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
  background: radial-gradient(ellipse at 50% 30%, #faf8f3 0%, #f0ece4 50%, #e8e3da 100%);
}
.login-card {
  background: #fff;
  border-radius: 20px;
  padding: 48px 40px;
  width: 380px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.08);
  text-align: center;
}
h1 {
  font-size: 28px;
  color: #2c3e50;
  margin: 0 0 8px;
}
.subtitle {
  color: #999;
  margin: 0 0 32px;
  font-size: 14px;
}
.tabs {
  display: flex;
  background: #f5f5f0;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 28px;
}
.tabs button {
  flex: 1;
  padding: 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 15px;
  color: #888;
  transition: all 0.3s;
}
.tabs button.active {
  background: #3498db;
  color: #fff;
  border-radius: 10px;
}
.form-group {
  margin-bottom: 16px;
}
input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-size: 15px;
  background: #fafafa;
  transition: border-color 0.3s;
  box-sizing: border-box;
}
input:focus {
  outline: none;
  border-color: #3498db;
}
.error {
  color: #e74c3c;
  font-size: 13px;
  margin: 0 0 12px;
}
.submit-btn {
  width: 100%;
  padding: 12px;
  background: #3498db;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}
.submit-btn:hover {
  background: #2980b9;
}
.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
