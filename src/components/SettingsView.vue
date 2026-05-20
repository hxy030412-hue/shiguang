<template>
  <div class="settings-page" :class="{ dark: darkMode }">
    <div class="settings-card">
      <h2>个人设置</h2>

      <div class="avatar-section">
        <div class="avatar">
          <img v-if="form.avatar" :src="form.avatar" alt="头像" />
          <div v-else class="avatar-placeholder">{{ form.nickname?.charAt(0) || '?' }}</div>
        </div>
        <div class="avatar-input">
          <label>头像 URL</label>
          <input v-model="form.avatar" placeholder="输入头像图片链接" />
        </div>
      </div>

      <div class="form-group">
        <label>昵称</label>
        <input v-model="form.nickname" placeholder="你的昵称" />
      </div>

      <div class="form-group">
        <label>个人简介</label>
        <textarea v-model="form.bio" placeholder="写一句话介绍自己" rows="3"></textarea>
      </div>

      <div class="form-group toggle-row">
        <label>深色模式</label>
        <button class="toggle-btn" :class="{ active: darkMode }" @click="$emit('toggle-dark')">
          {{ darkMode ? '🌙 开启' : '☀️ 关闭' }}
        </button>
      </div>

      <button class="save-btn" @click="save" :disabled="saving">
        {{ saving ? '保存中...' : '保存' }}
      </button>
      <p v-if="saved" class="saved-msg">已保存</p>
      <p v-if="error" class="error-msg">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { api } from '../api'

const props = defineProps({
  darkMode: Boolean,
  user: Object
})
defineEmits(['toggle-dark'])

const form = reactive({
  avatar: '',
  nickname: '',
  bio: ''
})
const saved = ref(false)
const saving = ref(false)
const error = ref('')

onMounted(() => {
  if (props.user) {
    form.avatar = props.user.avatar || ''
    form.nickname = props.user.nickname || ''
    form.bio = props.user.bio || ''
  }
})

async function save() {
  saving.value = true
  error.value = ''
  try {
    await api.updateProfile({
      nickname: form.nickname,
      avatar: form.avatar,
      bio: form.bio
    })
    saved.value = true
    setTimeout(() => { saved.value = false }, 2000)
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.settings-page {
  padding-top: 100px;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  background: var(--bg);
  transition: background 0.5s;
}

.settings-card {
  background: var(--surface);
  backdrop-filter: blur(24px) saturate(1.2);
  -webkit-backdrop-filter: blur(24px) saturate(1.2);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: 40px;
  width: 480px;
  max-width: 90%;
  box-shadow: var(--shadow-lg);
  height: fit-content;
  transition: background 0.5s;
}

h2 {
  margin: 0 0 32px;
  font-size: var(--text-2xl);
  color: var(--text);
  font-weight: 500;
  font-family: var(--font-serif);
  letter-spacing: var(--tracking-normal);
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 28px;
}
.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--input-bg);
  border: 2px solid var(--border);
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  color: var(--text-muted);
}
.avatar-input {
  flex: 1;
}

.form-group {
  margin-bottom: 20px;
}
label {
  display: block;
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 6px;
}
input, textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--input-border);
  border-radius: var(--radius-sm);
  font-size: 15px;
  background: var(--input-bg);
  color: var(--text);
  transition: border-color 0.3s, box-shadow 0.3s;
}
input:focus, textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}
input::placeholder, textarea::placeholder {
  color: var(--text-muted);
}
textarea {
  resize: vertical;
  font-family: inherit;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.toggle-btn {
  padding: 8px 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--input-bg);
  cursor: pointer;
  font-size: 14px;
  color: var(--text-secondary);
  transition: all 0.3s;
}
.toggle-btn.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.save-btn {
  width: 100%;
  padding: 12px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 16px;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.3s, box-shadow 0.3s;
  box-shadow: 0 2px 12px var(--accent-glow);
}
.save-btn:hover {
  background: var(--accent-hover);
  box-shadow: 0 4px 20px var(--accent-glow);
}
.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.saved-msg {
  text-align: center;
  color: var(--success);
  margin-top: 12px;
  font-size: 14px;
}
.error-msg {
  text-align: center;
  color: var(--error);
  margin-top: 12px;
  font-size: 14px;
}
</style>
