<template>
  <div class="home">
    <div class="layout-switch">
      <button
        :class="{ active: layout === 'grid' }"
        @click="layout = 'grid'"
      >瀑布流</button>
      <button
        :class="{ active: layout === 'scatter' }"
        @click="layout = 'scatter'"
      >随机漂浮</button>
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
      <div class="empty-icon">📷</div>
      <h3>还没有照片</h3>
      <p>收集你的第一束光，开始记录旅途中的美好瞬间</p>
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
        @select-photo="onSelectScatter"
      />
    </template>

    <PhotoModal
      v-if="selectedPhoto"
      :photo="selectedPhoto"
      :originRect="originRect"
      @close="selectedPhoto = null"
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
  loadingPhotos: Boolean
})
const emit = defineEmits(['load-more'])

const layout = ref('scatter')
const selectedPhoto = ref(null)
const originRect = ref(null)

function onScroll() {
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
</script>

<style scoped>
.layout-switch {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 90;
  display: flex;
  background: var(--surface);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--glass-border);
  transition: background 0.5s;
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

/* Skeleton */
.skeleton-wrap {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding: 120px 32px 32px;
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
  font-size: 18px;
  color: var(--text);
  margin-bottom: 8px;
  font-weight: 400;
  letter-spacing: 0.06em;
}
.empty-state p {
  font-size: 14px;
  color: var(--text-muted);
  max-width: 260px;
  line-height: 1.7;
  letter-spacing: 0.02em;
}
</style>
