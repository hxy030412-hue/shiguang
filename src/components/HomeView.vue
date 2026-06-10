<template>
  <div class="home">
    <!-- Hero 区域 -->
    <section class="hero" :class="{ 'hero-faded': scrolled }">
      <div class="hero-bg">
        <div class="hero-glow"></div>
        <div class="hero-glow-2"></div>
        <div v-for="i in 12" :key="i" class="hero-particle" :style="particleStyle(i)"></div>
      </div>
      <div class="hero-content">
        <h1 class="hero-title">拾光</h1>
        <p class="hero-subtitle">记录值得被记住的瞬间</p>
        <div class="hero-divider"></div>
        <p class="hero-desc">每一张照片，都是时光的标本</p>
      </div>
      <div class="hero-scroll-hint" @click="scrollToContent">
        <span>向下探索</span>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 4V16M10 16L5 11M10 16L15 11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </section>

    <!-- 内容区域 -->
    <section class="content-section" ref="contentRef">
      <div class="layout-switch" :class="{ 'switch-visible': scrolled }">
        <button
          :class="{ active: layout === 'grid' }"
          @click="layout = 'grid'"
        >时光轴</button>
        <button
          :class="{ active: layout === 'scatter' }"
          @click="layout = 'scatter'"
        >记忆墙</button>
        <button
          v-if="layout === 'scatter'"
          class="edit-btn"
          :class="{ active: editMode }"
          @click="editMode = !editMode"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          {{ editMode ? '完成整理' : '编辑' }}
        </button>
      </div>

      <!-- 骨架屏 -->
      <div v-if="loadingPhotos" class="skeleton-wrap">
        <div v-for="i in 6" :key="i" class="skeleton-card">
          <div class="skeleton-img"></div>
          <div class="skeleton-line w60"></div>
          <div class="skeleton-line w40"></div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!photos.length" class="empty-state">
        <div class="empty-icon">✨</div>
        <h3>还没有回忆</h3>
        <p>捕捉你的第一段回忆，开始记录值得被记住的瞬间</p>
      </div>

      <template v-else>
        <GridLayout
          v-if="layout === 'grid'"
          :photos="photos"
          :darkMode="darkMode"
          :selectedPhotoId="selectedPhoto?.id"
          @select-photo="onSelectGrid"
        />
        <ScatterLayout
          v-else
          :photos="photos"
          :darkMode="darkMode"
          :selectedPhotoId="selectedPhoto?.id"
          :layoutMap="layoutMap"
          :editMode="editMode"
          @select-photo="onSelectScatter"
          @save-layout="$emit('save-layout', $event)"
          @reset-layout="$emit('reset-layout')"
        />
      </template>
    </section>

    <PhotoModal
      v-if="selectedPhoto"
      :photo="selectedPhoto"
      :originRect="originRect"
      @close="selectedPhoto = null"
      @archive-photo="onArchivePhoto"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import GridLayout from './GridLayout.vue'
import ScatterLayout from './ScatterLayout.vue'
import PhotoModal from './PhotoModal.vue'

const props = defineProps({
  photos: Array,
  darkMode: Boolean,
  hasMore: Boolean,
  loadingPhotos: Boolean,
  layoutMap: Object
})
const emit = defineEmits(['load-more', 'scroll-update', 'save-layout', 'reset-layout', 'archive-photo'])

const layout = ref('scatter')
const editMode = ref(false)
const selectedPhoto = ref(null)
const originRect = ref(null)
const scrolled = ref(false)
const contentRef = ref(null)

function particleStyle(i) {
  const size = 2 + Math.random() * 4
  const left = Math.random() * 100
  const top = Math.random() * 100
  const delay = Math.random() * 8
  const duration = 6 + Math.random() * 8
  return {
    width: size + 'px',
    height: size + 'px',
    left: left + '%',
    top: top + '%',
    animationDelay: delay + 's',
    animationDuration: duration + 's'
  }
}

function scrollToContent() {
  contentRef.value?.scrollIntoView({ behavior: 'smooth' })
}

function onScroll() {
  scrolled.value = window.scrollY > 100
  emit('scroll-update', window.scrollY)

  if (!props.hasMore) return
  const scrollBottom = window.innerHeight + window.scrollY
  if (scrollBottom >= document.body.offsetHeight - 300) {
    emit('load-more')
  }
}

onMounted(() => window.addEventListener('scroll', onScroll))
onUnmounted(() => window.removeEventListener('scroll', onScroll))

function onSelectScatter({ photo, rect }) {
  originRect.value = rect
  selectedPhoto.value = photo
}

function onSelectGrid({ photo, rect }) {
  originRect.value = rect
  selectedPhoto.value = photo
}

function onArchivePhoto(photoId) {
  selectedPhoto.value = null
  emit('archive-photo', photoId)
}
</script>

<style scoped>
/* ========== Hero ========== */
.hero {
  position: relative;
  height: 100vh;
  min-height: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: opacity 0.8s ease;
}
.hero-faded {
  opacity: 0.3;
  pointer-events: none;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background: var(--bg-gradient);
}
.hero-glow {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(212, 160, 106, 0.12) 0%, transparent 70%);
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  animation: glowPulse 8s ease-in-out infinite;
}
.hero-glow-2 {
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(184, 115, 57, 0.08) 0%, transparent 70%);
  bottom: 20%;
  right: 15%;
  animation: glowPulse 12s ease-in-out infinite 3s;
}

@keyframes glowPulse {
  0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.6; }
  50% { transform: translateX(-50%) scale(1.15); opacity: 1; }
}

/* 漂浮光粒子 */
.hero-particle {
  position: absolute;
  border-radius: 50%;
  background: rgba(212, 160, 106, 0.3);
  pointer-events: none;
  animation: particleFloat linear infinite;
}
@keyframes particleFloat {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  10% { opacity: 0.8; }
  90% { opacity: 0.8; }
  100% { transform: translateY(-120px) scale(0.3); opacity: 0; }
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  animation: heroFadeIn 1.2s ease;
}
@keyframes heroFadeIn {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.hero-title {
  font-size: clamp(48px, 8vw, 80px);
  font-weight: 200;
  font-family: var(--font-serif);
  color: var(--text);
  letter-spacing: 0.15em;
  margin: 0 0 16px;
  line-height: 1.1;
}
.hero-subtitle {
  font-size: clamp(16px, 2.5vw, 22px);
  color: var(--text-secondary);
  letter-spacing: 0.12em;
  font-weight: 300;
  margin: 0 0 32px;
}
.hero-divider {
  width: 48px;
  height: 1px;
  background: var(--accent);
  margin: 0 auto 24px;
  opacity: 0.5;
}
.hero-desc {
  font-size: var(--text-sm);
  color: var(--text-muted);
  letter-spacing: 0.08em;
  margin: 0;
  font-family: var(--font-serif);
}

.hero-scroll-hint {
  position: absolute;
  bottom: 48px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 12px;
  letter-spacing: 0.08em;
  cursor: pointer;
  animation: scrollBounce 2.5s ease-in-out infinite;
  transition: color 0.3s;
  z-index: 1;
}
.hero-scroll-hint:hover {
  color: var(--accent);
}
@keyframes scrollBounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(8px); }
}

/* ========== Content ========== */
.content-section {
  position: relative;
  min-height: 60vh;
  padding-top: 20px;
}

.layout-switch {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%) translateY(-20px);
  z-index: 90;
  display: flex;
  background: var(--surface);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--glass-border);
  transition: background 0.5s, opacity 0.5s, transform 0.5s;
  opacity: 0;
}
.layout-switch.switch-visible {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
.layout-switch button {
  padding: 7px 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-muted);
  transition: all 0.3s;
  letter-spacing: 0.04em;
}
.layout-switch button.active {
  background: var(--accent);
  color: #fff;
  border-radius: 24px;
}
.edit-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  border-left: 1px solid var(--border) !important;
  padding-left: 16px !important;
  margin-left: 4px;
}

/* Skeleton */
.skeleton-wrap {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding: 40px 32px 32px;
}
.skeleton-card {
  background: var(--surface-solid);
  border-radius: var(--radius-md);
  padding: 12px;
  box-shadow: var(--shadow-card);
}
.skeleton-img {
  width: 100%;
  height: 200px;
  border-radius: var(--radius-sm);
  background: linear-gradient(110deg, var(--border) 25%, var(--accent-glow) 37%, var(--border) 63%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
.skeleton-line {
  height: 14px;
  border-radius: 7px;
  margin-top: 12px;
  background: linear-gradient(110deg, var(--border) 25%, var(--accent-glow) 37%, var(--border) 63%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
.skeleton-line.w60 { width: 60%; }
.skeleton-line.w40 { width: 40%; animation-delay: 0.15s; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
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
  letter-spacing: var(--tracking-normal);
}

/* 响应式 */
@media (max-width: 768px) {
  .hero {
    min-height: 100svh;
  }
  .skeleton-wrap {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
