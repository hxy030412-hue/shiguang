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
  background: #f5f5f0;
  transition: background 0.5s;
}
.settings-page.dark {
  background: #151210;
}

.settings-card {
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  width: 480px;
  max-width: 90%;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  height: fit-content;
}
.settings-page.dark .settings-card {
  background: #1e1a16;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

h2 {
  margin: 0 0 32px;
  font-size: 24px;
  color: #2c3e50;
}
.settings-page.dark h2 {
  color: #e8d5b7;
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
  background: #f0f0f0;
}
.settings-page.dark .avatar {
  background: #3a332a;
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
  color: #999;
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
  color: #666;
  margin-bottom: 6px;
}
.settings-page.dark label {
  color: #a09080;
}
input, textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 15px;
  background: #fafafa;
  color: #333;
  transition: border-color 0.3s;
}
.settings-page.dark input,
.settings-page.dark textarea {
  background: #2a2520;
  border-color: #3a332a;
  color: #e8d5b7;
}
input:focus, textarea:focus {
  outline: none;
  border-color: #3498db;
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
  border: none;
  border-radius: 8px;
  background: #f0f0f0;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.3s;
}
.toggle-btn.active {
  background: #2c3e50;
  color: #fff;
}

.save-btn {
  width: 100%;
  padding: 12px;
  background: #3498db;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.3s;
}
.save-btn:hover {
  background: #2980b9;
}
.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.saved-msg {
  text-align: center;
  color: #27ae60;
  margin-top: 12px;
  font-size: 14px;
}
.error-msg {
  text-align: center;
  color: #e74c3c;
  margin-top: 12px;
  font-size: 14px;
}
</style>
