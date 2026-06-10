<template>
  <div class="map-page" :class="{ dark: darkMode }">
    <!-- 地图 -->
    <div id="map" ref="mapEl"></div>

    <!-- 暗角蒙版 -->
    <div class="vignette"></div>

    <!-- 顶部标题 -->
    <div class="map-header">
      <h1>人生地图</h1>
      <span class="photo-count">{{ photos.length }} 个记忆</span>
    </div>

    <!-- 浮动记忆卡 — 点击标记时显示 -->
    <Transition name="card-float">
      <div v-if="activePhoto" class="memory-card" @click="openPhoto">
        <div class="memory-card-img">
          <img :src="activePhoto.url" :alt="activePhoto.title" />
        </div>
        <div class="memory-card-body">
          <h3>{{ activePhoto.title }}</h3>
          <p class="memory-meta">
            <span v-if="activePhoto.date">{{ activePhoto.date }}</span>
            <span v-if="activePhoto.location"> · {{ activePhoto.location }}</span>
          </p>
          <p class="memory-story" v-if="activePhoto.story">{{ activePhoto.story }}</p>
        </div>
        <button class="memory-close" @click.stop="activePhoto = null">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </Transition>

    <!-- 照片弹窗 -->
    <PhotoModal
      v-if="selectedPhoto"
      :photo="selectedPhoto"
      :originRect="null"
      @close="selectedPhoto = null"
    />

    <!-- 底部照片条 -->
    <div class="photo-strip">
      <div
        v-for="photo in photos"
        :key="photo.id"
        class="strip-item"
        :class="{ active: activePhoto?.id === photo.id }"
        @click="focusPhoto(photo)"
      >
        <img :src="photo.url" :alt="photo.title" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import PhotoModal from './PhotoModal.vue'

const props = defineProps({
  photos: Array,
  darkMode: Boolean
})

const mapEl = ref(null)
const activePhoto = ref(null)
const selectedPhoto = ref(null)
let map = null

function openPhoto() {
  selectedPhoto.value = activePhoto.value
  activePhoto.value = null
}
let tileLayer = null
let markers = []

function initMap() {
  map = L.map(mapEl.value, {
    center: [30, 20],
    zoom: 2,
    minZoom: 2,
    zoomControl: false,
    attributionControl: false
  })

  const tileUrl = props.darkMode
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

  tileLayer = L.tileLayer(tileUrl, {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    className: 'map-tiles'
  }).addTo(map)

  buildRouteAndMarkers()

  // 点击地图空白处关闭卡片
  map.on('click', (e) => {
    if (e.originalEvent.target.closest('.leaflet-marker-icon')) return
    activePhoto.value = null
  })
}

function buildRouteAndMarkers() {
  if (!props.photos.length) return

  // 清除旧标记
  markers.forEach(m => map.removeLayer(m))
  markers = []

  const coords = props.photos
    .filter(p => p.lat && p.lng)
    .map(p => [p.lat, p.lng])

  if (coords.length < 2) return

  // 发光路线 — 底层光晕
  L.polyline(coords, {
    color: props.darkMode ? 'rgba(212,160,106,0.15)' : 'rgba(201,133,77,0.12)',
    weight: 12,
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(map)

  // 发光路线 — 中层
  L.polyline(coords, {
    color: props.darkMode ? 'rgba(212,160,106,0.35)' : 'rgba(201,133,77,0.25)',
    weight: 5,
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(map)

  // 发光路线 — 核心线
  L.polyline(coords, {
    color: props.darkMode ? '#d4a06a' : '#c9854d',
    weight: 2,
    opacity: 0.8,
    dashArray: '6, 10',
    lineCap: 'round'
  }).addTo(map)

  // 照片标记
  props.photos.forEach((photo, i) => {
    if (!photo.lat || !photo.lng) return

    const icon = L.divIcon({
      className: 'photo-marker',
      html: `
        <div class="marker-ring">
          <div class="marker-img">
            <img src="${photo.url}" />
          </div>
          <div class="marker-pulse"></div>
        </div>
      `,
      iconSize: [52, 52],
      iconAnchor: [26, 26]
    })

    const marker = L.marker([photo.lat, photo.lng], { icon }).addTo(map)
    marker.on('click', () => {
      activePhoto.value = photo
      map.flyTo([photo.lat, photo.lng], Math.max(map.getZoom(), 5), {
        duration: 0.8,
        easeLinearity: 0.25
      })
    })
    markers.push(marker)
  })

  // 自适应边界
  if (coords.length > 1) {
    map.fitBounds(coords, { padding: [60, 60], maxZoom: 6 })
  }
}

function focusPhoto(photo) {
  activePhoto.value = photo
  if (photo.lat && photo.lng) {
    map.flyTo([photo.lat, photo.lng], Math.max(map.getZoom(), 5), {
      duration: 0.8,
      easeLinearity: 0.25
    })
  }
}

watch(() => props.darkMode, (dark) => {
  if (!map || !tileLayer) return
  const url = dark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
  tileLayer.setUrl(url)
})

watch(() => props.photos, async () => {
  await nextTick()
  if (map) buildRouteAndMarkers()
}, { deep: true })

onMounted(initMap)
</script>

<style scoped>
.map-page {
  padding-top: 64px;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: var(--bg);
}
.map-page.dark {
  background: transparent;
}

#map {
  width: 100%;
  height: calc(100vh - 64px);
  z-index: 1;
}

/* 地图瓦片柔和处理 */
:deep(.map-tiles) {
  filter: saturate(0.8) brightness(1.02);
  transition: filter 0.5s;
}
.map-page.dark :deep(.map-tiles) {
  filter: saturate(0.6) brightness(0.75);
}

/* 暗角蒙版 */
.vignette {
  position: absolute;
  top: 64px;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 2;
  background:
    radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.06) 100%);
}
.map-page.dark .vignette {
  background:
    radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.25) 100%);
}

/* 顶部标题 */
.map-header {
  position: absolute;
  top: 80px;
  left: 28px;
  z-index: 10;
  pointer-events: none;
}
.map-header h1 {
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: 500;
  font-family: var(--font-serif);
  color: var(--text);
  letter-spacing: var(--tracking-wide);
  text-shadow: 0 1px 8px rgba(255,255,255,0.6);
}
.map-page.dark .map-header h1 {
  text-shadow: 0 1px 12px rgba(0,0,0,0.5);
}
.photo-count {
  font-size: var(--text-sm);
  color: var(--text-muted);
  letter-spacing: var(--tracking-wide);
}

/* 浮动记忆卡 */
.memory-card {
  position: absolute;
  top: 80px;
  right: 28px;
  width: 280px;
  background: var(--surface);
  backdrop-filter: blur(24px) saturate(1.2);
  -webkit-backdrop-filter: blur(24px) saturate(1.2);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  overflow: hidden;
  z-index: 10;
  cursor: pointer;
  box-shadow: var(--shadow-lg);
  transition: transform 0.3s, box-shadow 0.3s;
}
.memory-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 48px rgba(0,0,0,0.15);
}
.memory-card-img {
  height: 160px;
  overflow: hidden;
}
.memory-card-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.5s;
}
.memory-card:hover .memory-card-img img {
  transform: scale(1.04);
}
.memory-card-body {
  padding: 16px 18px 20px;
}
.memory-card-body h3 {
  margin: 0 0 6px;
  font-size: var(--text-lg);
  font-weight: 500;
  font-family: var(--font-serif);
  color: var(--text);
  letter-spacing: var(--tracking-normal);
}
.memory-meta {
  margin: 0 0 10px;
  font-size: var(--text-xs);
  color: var(--text-muted);
  letter-spacing: var(--tracking-wide);
}
.memory-story {
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.memory-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0,0,0,0.3);
  backdrop-filter: blur(8px);
  border: none;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s, background 0.3s;
}
.memory-card:hover .memory-close {
  opacity: 1;
}
.memory-close:hover {
  background: rgba(0,0,0,0.5);
}

/* 卡片出入动画 */
.card-float-enter-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.card-float-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.card-float-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.96);
}
.card-float-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

/* 底部照片条 */
.photo-strip {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  background: var(--surface);
  backdrop-filter: blur(20px) saturate(1.2);
  -webkit-backdrop-filter: blur(20px) saturate(1.2);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  box-shadow: var(--shadow-md);
  max-width: calc(100vw - 40px);
  overflow-x: auto;
  scrollbar-width: none;
}
.photo-strip::-webkit-scrollbar { display: none; }

.strip-item {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s;
  opacity: 0.7;
}
.strip-item:hover {
  opacity: 1;
  transform: scale(1.08);
}
.strip-item.active {
  border-color: var(--accent);
  opacity: 1;
  box-shadow: 0 0 0 3px var(--accent-glow);
}
.strip-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 标记样式 */
:deep(.photo-marker) {
  background: none;
  border: none;
}
:deep(.marker-ring) {
  position: relative;
  width: 52px;
  height: 52px;
}
:deep(.marker-img) {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #fff;
  box-shadow: 0 2px 16px rgba(0,0,0,0.25);
  transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
:deep(.marker-img:hover) {
  transform: translate(-50%, -50%) scale(1.2);
}
:deep(.marker-img img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
:deep(.marker-pulse) {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: rgba(201, 133, 77, 0.2);
  animation: markerPulse 2.5s ease-in-out infinite;
}
.map-page.dark :deep(.marker-pulse) {
  background: rgba(212, 160, 106, 0.25);
}
.map-page.dark :deep(.marker-img) {
  border-color: #2a2520;
}

@keyframes markerPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
  50% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
}

/* 隐藏默认 popup */
:deep(.leaflet-popup-content-wrapper) {
  display: none;
}
</style>
