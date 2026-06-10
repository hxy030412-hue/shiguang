<template>
  <div class="timebox-page" :class="{ dark: darkMode }">
    <div class="timebox-header">
      <h1>📦 时光盒</h1>
      <p class="timebox-subtitle">收进时光盒的回忆，随时可以放回</p>
    </div>

    <!-- 加载中 -->
    <div v-if="loadingArchived" class="loading-state">
      <div class="loading-dot"></div>
      <span>加载中…</span>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!archivedPhotos.length" class="empty-state">
      <div class="empty-icon">📦</div>
      <h3>时光盒是空的</h3>
      <p>当你把回忆收进时光盒时，它们会出现在这里</p>
    </div>

    <!-- 照片网格 -->
    <div v-else class="timebox-grid">
      <div
        v-for="photo in archivedPhotos"
        :key="photo.id"
        class="timebox-card"
      >
        <div class="card-img">
          <img :src="photo.url" :alt="photo.title" loading="lazy" />
        </div>
        <div class="card-body">
          <h3>{{ photo.title }}</h3>
          <p class="card-date">{{ photo.date }}</p>
          <button class="restore-btn" @click="onRestore(photo)">
            ✨ 放回回忆馆
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { api } from '../api'

const props = defineProps({
  archivedPhotos: Array,
  darkMode: Boolean,
  loadingArchived: Boolean
})
const emit = defineEmits(['load-archived', 'restore-photo'])

onMounted(() => {
  emit('load-archived')
})

async function onRestore(photo) {
  try {
    await api.archivePhoto(photo.id, false)
    emit('restore-photo', photo.id)
  } catch (e) {
    console.error('恢复失败:', e)
  }
}
</script>

<style scoped>
.timebox-page {
  padding-top: 100px;
  min-height: 100vh;
  background: var(--bg);
  transition: background 0.5s;
}
.timebox-page.dark {
  background: transparent;
}

.timebox-header {
  text-align: center;
  margin-bottom: 48px;
  padding: 0 32px;
}
.timebox-header h1 {
  font-size: var(--text-3xl);
  font-weight: 300;
  font-family: var(--font-serif);
  color: var(--text);
  letter-spacing: var(--tracking-wider);
  margin: 0 0 12px;
}
.timebox-subtitle {
  font-size: var(--text-sm);
  color: var(--text-muted);
  letter-spacing: var(--tracking-wide);
  margin: 0;
}

/* 加载状态 */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 40vh;
  color: var(--text-muted);
  font-size: var(--text-sm);
}
.loading-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  animation: dotPulse 1s ease-in-out infinite;
}
@keyframes dotPulse {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  padding: 32px;
  text-align: center;
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 24px;
  opacity: 0.4;
}
.empty-state h3 {
  font-size: var(--text-xl);
  color: var(--text);
  margin-bottom: 8px;
  font-weight: 400;
  font-family: var(--font-serif);
  letter-spacing: var(--tracking-wide);
}
.empty-state p {
  font-size: var(--text-sm);
  color: var(--text-muted);
  max-width: 260px;
  line-height: var(--leading-relaxed);
}

/* 照片网格 */
.timebox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
  padding: 0 32px 60px;
  max-width: 1200px;
  margin: 0 auto;
}

.timebox-card {
  background: var(--surface);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  transition: transform 0.3s, box-shadow 0.3s;
}
.timebox-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card-hover);
}

.card-img {
  width: 100%;
  height: 200px;
  overflow: hidden;
}
.card-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.5s;
}
.timebox-card:hover .card-img img {
  transform: scale(1.04);
}

.card-body {
  padding: 16px 18px 20px;
}
.card-body h3 {
  margin: 0 0 4px;
  font-size: var(--text-base);
  font-weight: 500;
  font-family: var(--font-serif);
  color: var(--text);
  letter-spacing: var(--tracking-normal);
}
.card-date {
  font-size: var(--text-xs);
  color: var(--text-muted);
  letter-spacing: var(--tracking-wide);
  margin: 0 0 14px;
}

.restore-btn {
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s;
  letter-spacing: 0.04em;
}
.restore-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-glow);
}
</style>
