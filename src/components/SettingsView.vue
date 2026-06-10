<template>
  <div class="settings-page" :class="{ dark: darkMode }">
    <div class="settings-card">
      <h2>个人设置</h2>

      <!-- 头像上传区域 -->
      <div class="avatar-section">
        <div
          class="avatar-upload"
          :class="{ 'drag-over': isDragOver, uploading: uploading }"
          @click="fileInput?.click()"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
          @drop.prevent="onDrop"
        >
          <div class="avatar-ring">
            <img v-if="preview" :src="preview" alt="头像" class="avatar-img" />
            <div v-else class="avatar-placeholder">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <!-- 上传中遮罩 -->
            <div v-if="uploading" class="avatar-loading">
              <div class="spinner"></div>
            </div>
            <!-- 悬停遮罩 -->
            <div v-else class="avatar-overlay">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span>{{ isDragOver ? '松开上传' : '更换头像' }}</span>
            </div>
          </div>
          <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/gif,image/webp" @change="onFileChange" hidden />
        </div>
        <div class="avatar-info">
          <p class="avatar-hint">点击或拖拽图片上传</p>
          <p class="avatar-limit">支持 JPG、PNG、GIF、WebP，最大 5MB</p>
        </div>
      </div>

      <!-- 上传成功提示 -->
      <Transition name="toast">
        <div v-if="toast" class="toast" :class="toast.type">
          <span>{{ toast.message }}</span>
        </div>
      </Transition>

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
const emit = defineEmits(['toggle-dark', 'update-user'])

const form = reactive({
  avatar: '',
  nickname: '',
  bio: ''
})
const saved = ref(false)
const saving = ref(false)
const error = ref('')
const file = ref(null)
const preview = ref('')
const uploading = ref(false)
const isDragOver = ref(false)
const fileInput = ref(null)
const toast = ref(null)

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

onMounted(() => {
  if (props.user) {
    form.avatar = props.user.avatar || ''
    form.nickname = props.user.nickname || ''
    form.bio = props.user.bio || ''
    if (form.avatar) preview.value = form.avatar
  }
})

function showToast(message, type = 'success') {
  toast.value = { message, type }
  setTimeout(() => { toast.value = null }, 2500)
}

function validateFile(f) {
  if (!ALLOWED_TYPES.includes(f.type)) {
    showToast('请上传 JPG、PNG、GIF 或 WebP 格式的图片', 'error')
    return false
  }
  if (f.size > MAX_SIZE) {
    showToast('图片大小不能超过 5MB', 'error')
    return false
  }
  return true
}

function onFileChange(e) {
  const f = e.target.files[0]
  if (f && validateFile(f)) {
    file.value = f
    preview.value = URL.createObjectURL(f)
  }
  // 重置 input 以便重复选择同一文件
  e.target.value = ''
}

function onDrop(e) {
  isDragOver.value = false
  const f = e.dataTransfer.files[0]
  if (f && f.type.startsWith('image/') && validateFile(f)) {
    file.value = f
    preview.value = URL.createObjectURL(f)
  }
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    let avatarUrl = form.avatar

    // 如果有新文件，先上传
    if (file.value) {
      uploading.value = true
      try {
        const res = await api.upload(file.value)
        avatarUrl = res.url
        form.avatar = avatarUrl
        preview.value = avatarUrl
        file.value = null
        showToast('头像上传成功')
      } finally {
        uploading.value = false
      }
    }

    const updated = await api.updateProfile({
      nickname: form.nickname,
      avatar: avatarUrl,
      bio: form.bio
    })

    // 同步到父组件
    emit('update-user', {
      ...props.user,
      nickname: form.nickname,
      avatar: avatarUrl,
      bio: form.bio
    })

    showToast('保存成功')
  } catch (e) {
    error.value = e.message
    showToast(e.message, 'error')
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
.settings-page.dark {
  background: transparent;
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

/* ========== 头像上传 ========== */
.avatar-section {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 28px;
}

.avatar-upload {
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.3s;
}
.avatar-upload:hover {
  transform: scale(1.04);
}
.avatar-upload.uploading {
  pointer-events: none;
}

.avatar-ring {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  background: var(--input-bg);
  border: 2px solid var(--border);
  transition: border-color 0.3s, box-shadow 0.3s;
}
.avatar-upload:hover .avatar-ring {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-glow);
}
.avatar-upload.drag-over .avatar-ring {
  border-color: var(--accent);
  box-shadow: 0 0 0 6px var(--accent-glow);
  animation: ringPulse 1s ease-in-out infinite;
}
@keyframes ringPulse {
  0%, 100% { box-shadow: 0 0 0 4px var(--accent-glow); }
  50% { box-shadow: 0 0 0 8px var(--accent-glow); }
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #fff;
  font-size: 11px;
  letter-spacing: 0.04em;
  opacity: 0;
  transition: opacity 0.3s;
}
.avatar-upload:hover .avatar-overlay {
  opacity: 1;
}
.avatar-upload.drag-over .avatar-overlay {
  opacity: 1;
  background: rgba(194, 122, 62, 0.5);
}

.avatar-loading {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}
.spinner {
  width: 28px;
  height: 28px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.avatar-info {
  flex: 1;
}
.avatar-hint {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 4px;
}
.avatar-limit {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}

/* ========== Toast ========== */
.toast {
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  margin-bottom: 20px;
  text-align: center;
  letter-spacing: 0.02em;
}
.toast.success {
  background: rgba(90, 170, 120, 0.12);
  color: var(--success);
  border: 1px solid rgba(90, 170, 120, 0.2);
}
.toast.error {
  background: rgba(204, 68, 68, 0.1);
  color: var(--error);
  border: 1px solid rgba(204, 68, 68, 0.2);
}
.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ========== 表单 ========== */
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

.error-msg {
  text-align: center;
  color: var(--error);
  margin-top: 12px;
  font-size: 14px;
}
</style>
