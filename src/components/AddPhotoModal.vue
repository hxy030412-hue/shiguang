<template>
  <Teleport to="body">
    <div class="modal-mask" @click.self="close">
      <div class="modal-content">
        <button class="close-btn" @click="close">&times;</button>
        <h2>添加新日记</h2>

        <form @submit.prevent="submit">
          <div class="form-row">
            <div class="form-group">
              <label>标题</label>
              <input v-model="form.title" placeholder="给这段旅程起个名字" required />
            </div>
            <div class="form-group">
              <label>日期</label>
              <input v-model="form.date" type="date" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>地点</label>
              <input v-model="form.location" placeholder="例：日本·京都" />
            </div>
            <div class="form-group">
              <label>同行人</label>
              <input v-model="form.people" placeholder="例：家人、朋友" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>纬度</label>
              <input v-model.number="form.lat" type="number" step="any" placeholder="39.9" />
            </div>
            <div class="form-group">
              <label>经度</label>
              <input v-model.number="form.lng" type="number" step="any" placeholder="116.4" />
            </div>
          </div>

          <div class="form-group">
            <label>故事</label>
            <textarea v-model="form.story" placeholder="记录这段旅程中的故事..." rows="4"></textarea>
          </div>

          <div class="form-group">
            <label>照片</label>
            <div class="upload-area" @click="fileInput?.click()" @dragover.prevent @drop.prevent="onDrop">
              <img v-if="preview" :src="preview" class="preview" />
              <div v-else class="upload-placeholder">
                <span class="upload-icon">+</span>
                <span>点击或拖拽上传图片</span>
              </div>
              <input ref="fileInput" type="file" accept="image/*" @change="onFileChange" hidden />
            </div>
          </div>

          <p v-if="error" class="error">{{ error }}</p>

          <button type="submit" class="submit-btn" :disabled="submitting">
            {{ submitting ? '上传中...' : '保存日记' }}
          </button>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { api } from '../api'

const emit = defineEmits(['close', 'saved'])

const fileInput = ref(null)
const file = ref(null)
const preview = ref('')
const error = ref('')
const submitting = ref(false)

const form = reactive({
  title: '',
  date: new Date().toISOString().slice(0, 10),
  location: '',
  people: '',
  story: '',
  lat: null,
  lng: null
})

function onFileChange(e) {
  const f = e.target.files[0]
  if (f) setFile(f)
}

function onDrop(e) {
  const f = e.dataTransfer.files[0]
  if (f && f.type.startsWith('image/')) setFile(f)
}

function setFile(f) {
  file.value = f
  preview.value = URL.createObjectURL(f)
}

async function submit() {
  if (!form.title || !form.date) {
    error.value = '请填写标题和日期'
    return
  }
  error.value = ''
  submitting.value = true
  try {
    let url = ''
    if (file.value) {
      const uploadRes = await api.upload(file.value)
      url = uploadRes.url
    }
    await api.createPhoto({
      url,
      title: form.title,
      date: form.date,
      location: form.location,
      people: form.people,
      story: form.story,
      lat: form.lat || 0,
      lng: form.lng || 0
    })
    emit('saved')
    emit('close')
  } catch (e) {
    error.value = e.message
  } finally {
    submitting.value = false
  }
}

function close() {
  emit('close')
}
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.25s ease;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: var(--surface);
  backdrop-filter: blur(24px) saturate(1.2);
  -webkit-backdrop-filter: blur(24px) saturate(1.2);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: 36px;
  width: 560px;
  max-width: 92%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: var(--shadow-lg);
  transition: background 0.5s;
}
h2 {
  margin: 0 0 28px;
  font-size: 22px;
  color: var(--text);
  font-weight: 600;
}
.close-btn {
  position: absolute;
  top: 16px;
  right: 20px;
  background: none;
  border: none;
  font-size: 28px;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.3s;
}
.close-btn:hover { color: var(--text); }

.form-row {
  display: flex;
  gap: 16px;
}
.form-row .form-group { flex: 1; }

.form-group {
  margin-bottom: 18px;
}
label {
  display: block;
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 6px;
}
input, textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--input-border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  background: var(--input-bg);
  color: var(--text);
  transition: border-color 0.3s, box-shadow 0.3s;
  box-sizing: border-box;
  font-family: inherit;
}
input:focus, textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}
input::placeholder, textarea::placeholder {
  color: var(--text-muted);
}
textarea { resize: vertical; }

.upload-area {
  border: 2px dashed var(--border-strong);
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.3s, background 0.3s;
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--input-bg);
}
.upload-area:hover {
  border-color: var(--accent);
  background: var(--accent-glow);
}
.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 14px;
}
.upload-icon {
  font-size: 36px;
  line-height: 1;
  color: var(--border-strong);
}
.preview {
  width: 100%;
  max-height: 240px;
  object-fit: cover;
  display: block;
}

.error {
  color: var(--error);
  font-size: 13px;
  margin: 0 0 12px;
}
.submit-btn {
  width: 100%;
  padding: 12px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s, box-shadow 0.3s;
  box-shadow: 0 2px 12px var(--accent-glow);
}
.submit-btn:hover {
  background: var(--accent-hover);
  box-shadow: 0 4px 20px var(--accent-glow);
}
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
