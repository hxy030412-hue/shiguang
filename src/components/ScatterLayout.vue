<template>
  <div class="scatter-container" :class="{ dark: darkMode }" @mousemove="onMouseMove">
    <!-- 纸质噪点纹理 -->
    <svg class="noise-svg">
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" opacity="0.04"/>
    </svg>

    <!-- 鼠标跟随光晕 -->
    <div class="cursor-glow" ref="glowEl"></div>

    <div
      v-for="(photo, index) in positionedPhotos"
      :key="photo.id"
      class="scatter-item"
      :ref="el => photoEls[photo.id] = el"
      :style="{
        left: photo.x + 'px',
        top: photo.y + 'px',
        width: photo.w + 'px',
        transform: `rotate(${photo.rotate}deg)`,
        zIndex: photo.z
      }"
      @mouseenter="onPhotoHover(photo)"
      @mousedown="onDragStart($event, photo)"
    >
      <img :src="photo.url" :alt="photo.title" />
      <div class="overlay">
        <span class="title">{{ photo.title }}</span>
        <span class="location">📍 {{ photo.location }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  photos: Array,
  darkMode: Boolean
})
const emit = defineEmits(['select-photo'])

const glowEl = ref(null)
const photoEls = ref({})
const positionedPhotos = ref([])
let maxZ = 50

function onMouseMove(e) {
  if (glowEl.value) {
    glowEl.value.style.left = e.clientX + 'px'
    glowEl.value.style.top = e.clientY + 'px'
  }
}

function onPhotoHover(photo) {
  maxZ++
  photo.z = maxZ
}

let dragState = null
let clickState = null

function onDragStart(e, photo) {
  e.preventDefault()
  maxZ++
  photo.z = maxZ
  const el = photoEls.value[photo.id]
  const startX = e.clientX - photo.x
  const startY = e.clientY - photo.y
  clickState = { photo, startTime: Date.now(), sx: e.clientX, sy: e.clientY }
  lastMouse = { x: e.clientX, y: e.clientY }
  dragState = { photo, startX, startY, el }
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
  document.addEventListener('mouseleave', onDragEnd)
}

let lastMouse = { x: 0, y: 0 }

function onDragMove(e) {
  if (!dragState) return
  e.preventDefault()
  lastMouse = { x: e.clientX, y: e.clientY }
  const { photo, startX, startY, el } = dragState
  photo.x = e.clientX - startX
  photo.y = e.clientY - startY
  el.style.transition = 'none'
}

function onDragEnd() {
  if (!dragState) return
  const { el } = dragState
  el.style.transition = ''
  const dt = Date.now() - clickState.startTime
  const dx = Math.abs(lastMouse.x - clickState.sx)
  const dy = Math.abs(lastMouse.y - clickState.sy)
  if (dt < 250 && dx < 5 && dy < 5) {
    const rect = el.getBoundingClientRect()
    emit('select-photo', { photo: clickState.photo, rect })
  }
  dragState = null
  clickState = null
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('mouseleave', onDragEnd)
}

onMounted(() => {
  const container = document.querySelector('.scatter-container')
  if (!container) return
  const cw = container.clientWidth - 40
  const seed = [12, 55, 28, 72, 5, 42, 85, 18, 62, 35, 78, 8]
  positionedPhotos.value = props.photos.map((photo, i) => ({
    ...photo,
    x: (seed[i % seed.length] / 100) * cw,
    y: 80 + Math.floor(i / 3) * 340 + (i % 2 === 0 ? 0 : 40),
    w: 220 + (i % 3) * 60,
    rotate: (i % 2 === 0 ? -1 : 1) * (5 + (i % 4) * 3),
    z: 10 - (i % 5)
  }))
})
</script>

<style scoped>
.scatter-container {
  position: relative;
  min-height: 1800px;
  padding: 20px;
  overflow-x: hidden;
  transition: background 0.6s ease;
  background: radial-gradient(ellipse at 50% 30%, #faf8f3 0%, #f0ece4 50%, #e8e3da 100%);
}
.scatter-container.dark {
  background: radial-gradient(ellipse at 50% 30%, #2a2520 0%, #1e1a16 50%, #151210 100%);
}

.noise-svg {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  z-index: 1;
}

.cursor-glow {
  position: fixed;
  width: 500px; height: 500px;
  border-radius: 50%;
  pointer-events: none;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(255,220,150,0.25) 0%, rgba(255,200,120,0.10) 35%, transparent 65%);
  transition: left 0.1s ease-out, top 0.1s ease-out;
  z-index: 2;
  left: -300px; top: -300px;
}
.scatter-container.dark .cursor-glow {
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(255,200,120,0.35) 0%, rgba(255,180,100,0.15) 25%, rgba(255,160,80,0.05) 50%, transparent 70%);
}

.scatter-item {
  position: absolute;
  border-radius: 10px;
  overflow: hidden;
  cursor: grab;
  transition: transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.4s, left 0s, top 0s;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}
.scatter-item:active { cursor: grabbing; }
.scatter-container.dark .scatter-item {
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
}
.scatter-item:hover {
  transform: rotate(0deg) scale(1.05) !important;
  box-shadow: 0 12px 40px rgba(0,0,0,0.25);
}
.scatter-container.dark .scatter-item:hover {
  box-shadow: 0 12px 50px rgba(0,0,0,0.6);
}
.scatter-item img {
  width: 100%;
  display: block;
  object-fit: cover;
  height: 200px;
}
.overlay {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  padding: 12px;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  color: #fff;
  opacity: 0;
  transition: opacity 0.3s;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.scatter-item:hover .overlay { opacity: 1; }
.title { font-size: 14px; font-weight: 600; }
.location { font-size: 12px; opacity: 0.85; }
</style>
