<template>
  <div class="scatter-container" :class="{ dark: darkMode }" @mousemove="onMouseMove">
    <!-- 纸质噪点纹理 -->
    <svg class="noise-svg" xmlns="http://www.w3.org/2000/svg">
      <filter id="paper-noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" seed="2"/>
        <feColorMatrix type="saturate" values="0"/>
      </filter>
      <rect width="100%" height="100%" filter="url(#paper-noise)" opacity="0.035"/>
    </svg>

    <!-- 梦幻光晕 -->
    <div class="ambient-glow glow-1"></div>
    <div class="ambient-glow glow-2"></div>

    <!-- 鼠标跟随光晕 -->
    <div class="cursor-glow" ref="glowEl"></div>

    <!-- 暗角蒙版 -->
    <div class="vignette"></div>

    <div
      v-for="(photo, index) in positionedPhotos"
      :key="photo.id"
      class="scatter-item"
      :class="{ 'is-dragging': dragState?.photo.id === photo.id, 'is-hidden': selectedPhotoId === photo.id }"
      :ref="el => photoEls[photo.id] = el"
      :style="{
        left: photo.x + 'px',
        top: photo.y + 'px',
        width: photo.w + 'px',
        '--rotate': photo.rotate + 'deg',
        zIndex: photo.z,
        '--float-delay': (index * -1.3) + 's',
        '--float-duration': (6 + (index % 4) * 2) + 's',
        animationDelay: (index * -0.8) + 's'
      }"
      @mouseenter="onPhotoHover(photo)"
      @mousedown="onDragStart($event, photo)"
    >
      <div class="card-inner">
        <img :src="photo.url" :alt="photo.title" loading="lazy" :style="{ height: photo.imgH + 'px' }" />
        <div class="polaroid-label">
          <span class="polaroid-title">{{ photo.title }}</span>
          <span class="polaroid-date">{{ photo.date }}</span>
        </div>
      </div>
      <div class="overlay">
        <span class="location">{{ photo.location }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  photos: Array,
  darkMode: Boolean,
  selectedPhotoId: Number
})
const emit = defineEmits(['select-photo'])

const glowEl = ref(null)
const photoEls = ref({})
const positionedPhotos = ref([])
const dragState = ref(null)
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
  dragState.value = { photo, startX, startY, el }
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
  document.addEventListener('mouseleave', onDragEnd)
}

let lastMouse = { x: 0, y: 0 }

function onDragMove(e) {
  if (!dragState.value) return
  e.preventDefault()
  lastMouse = { x: e.clientX, y: e.clientY }
  const { photo, startX, startY, el } = dragState.value
  photo.x = e.clientX - startX
  photo.y = e.clientY - startY
  el.style.transition = 'none'
  el.style.animation = 'none'
}

function onDragEnd() {
  if (!dragState.value) return
  const { el } = dragState.value
  el.style.transition = ''
  el.style.animation = ''
  const dt = Date.now() - clickState.startTime
  const dx = Math.abs(lastMouse.x - clickState.sx)
  const dy = Math.abs(lastMouse.y - clickState.sy)
  if (dt < 250 && dx < 5 && dy < 5) {
    const rect = el.getBoundingClientRect()
    emit('select-photo', { photo: clickState.photo, rect })
  }
  dragState.value = null
  clickState = null
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('mouseleave', onDragEnd)
}

// 有机散落布局 — 自由散乱分布
function calcPositions() {
  const container = document.querySelector('.scatter-container')
  if (!container || !props.photos.length) return
  const cw = container.clientWidth
  const ch = Math.max(container.clientHeight, 1600)
  const photos = props.photos
  const placed = []

  function seeded(i, seed) {
    const x = Math.sin(i * 9301 + seed * 49297) * 49297
    return x - Math.floor(x)
  }

  positionedPhotos.value = photos.map((photo, i) => {
    const sizeRoll = seeded(i, 1)
    const w = sizeRoll < 0.25 ? 180 : sizeRoll < 0.6 ? 220 : sizeRoll < 0.85 ? 260 : 300
    const imgH = w < 200 ? 150 : w < 240 ? 180 : 210

    const rotBase = (seeded(i, 2) - 0.5) * 20
    const rotate = Math.round(rotBase * 10) / 10

    const margin = 40
    const usableW = cw - w - margin * 2
    const usableH = ch - 300

    // 随机撒在整个画布范围
    let bestX = margin + seeded(i, 3) * usableW
    let bestY = 80 + seeded(i, 4) * usableH * 0.6

    // 多轮排斥，把重叠的推开
    for (let round = 0; round < 4; round++) {
      for (const p of placed) {
        const dx = bestX - p.x
        const dy = bestY - p.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const minDist = (w + p.w) * 0.45
        if (dist < minDist) {
          const push = (minDist - dist) * 0.5
          bestX += (dx / dist) * push
          bestY += (dy / dist) * push
        }
      }
    }

    bestX = Math.max(margin, Math.min(cw - w - margin, bestX))
    bestY = Math.max(60, bestY)

    placed.push({ x: bestX, y: bestY, w })

    const z = Math.floor(seeded(i, 5) * 15) + 1

    return { ...photo, x: bestX, y: bestY, w, imgH, rotate, z }
  })

  // 动态撑高容器
  const maxY = Math.max(...placed.map(p => p.y + 300))
  container.style.minHeight = maxY + 'px'
}

watch(() => props.photos, async () => {
  await nextTick()
  calcPositions()
}, { immediate: true })
</script>

<style scoped>
.scatter-container {
  position: relative;
  min-height: 100vh;
  padding: 20px;
  overflow-x: hidden;
  transition: background 0.5s ease;
  background: var(--bg-gradient);
}

/* 纸质噪点 */
.noise-svg {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  z-index: 1;
  opacity: 0.8;
}

/* 环境光晕 — 缓慢漂浮 */
.ambient-glow {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(80px);
  z-index: 0;
}
.glow-1 {
  width: 500px; height: 500px;
  background: rgba(201, 133, 77, 0.08);
  top: 10%; left: 60%;
  animation: ambientDrift1 20s ease-in-out infinite;
}
.glow-2 {
  width: 400px; height: 400px;
  background: rgba(212, 160, 106, 0.06);
  top: 50%; left: 20%;
  animation: ambientDrift2 25s ease-in-out infinite;
}
.scatter-container.dark .glow-1 {
  background: rgba(212, 160, 106, 0.12);
}
.scatter-container.dark .glow-2 {
  background: rgba(201, 133, 77, 0.1);
}

@keyframes ambientDrift1 {
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(-60px, 40px); }
  66% { transform: translate(30px, -50px); }
}
@keyframes ambientDrift2 {
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(50px, -30px); }
  66% { transform: translate(-40px, 60px); }
}

/* 鼠标光晕 */
.cursor-glow {
  position: fixed;
  width: 450px; height: 450px;
  border-radius: 50%;
  pointer-events: none;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(255,220,150,0.2) 0%, rgba(255,200,120,0.08) 35%, transparent 65%);
  mix-blend-mode: soft-light;
  transition: left 0.15s ease-out, top 0.15s ease-out;
  z-index: 4;
  left: -300px; top: -300px;
}
.scatter-container.dark .cursor-glow {
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(255,210,130,0.5) 0%, rgba(255,180,100,0.25) 20%, rgba(255,150,70,0.08) 45%, transparent 65%);
  mix-blend-mode: screen;
}

/* 暗角 */
.vignette {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  background: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.08) 100%);
}
.scatter-container.dark .vignette {
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.25) 100%);
}

/* 深夜模式全局暗化 */
.scatter-container.dark::after {
  content: '';
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.3);
  pointer-events: none;
  z-index: 3;
}

/* 拍立得卡片 */
.scatter-item {
  position: absolute;
  cursor: grab;
  transform: rotate(var(--rotate, 0deg));
  transition: transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.5s, left 0s, top 0s;
  animation: gentleFloat var(--float-duration) ease-in-out infinite;
  animation-delay: var(--float-delay);
}
.scatter-item:active { cursor: grabbing; }
.scatter-item.is-dragging {
  animation: none !important;
  transition: box-shadow 0.3s;
}
.scatter-item.is-hidden {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}

.card-inner {
  background: #fff;
  border-radius: 4px;
  padding: 10px 10px 0;
  box-shadow:
    0 2px 8px rgba(0,0,0,0.08),
    0 8px 24px rgba(0,0,0,0.06),
    0 16px 48px rgba(0,0,0,0.04);
  transition: box-shadow 0.5s, transform 0.5s;
  overflow: hidden;
}
.scatter-container.dark .card-inner {
  background: #2a2520;
  box-shadow:
    0 2px 8px rgba(0,0,0,0.2),
    0 8px 24px rgba(0,0,0,0.15),
    0 0 0 1px rgba(255,200,120,0.04);
}

.scatter-item:hover .card-inner {
  box-shadow:
    0 4px 16px rgba(0,0,0,0.12),
    0 12px 40px rgba(0,0,0,0.1),
    0 24px 64px rgba(0,0,0,0.08);
  transform: scale(1.03);
}
.scatter-container.dark .scatter-item:hover .card-inner {
  box-shadow:
    0 4px 16px rgba(0,0,0,0.3),
    0 12px 40px rgba(0,0,0,0.25),
    0 0 0 1px rgba(255,200,120,0.08);
}

.scatter-item:hover {
  transform: rotate(0deg) translateY(-4px) !important;
  z-index: 999 !important;
}

.card-inner img {
  width: 100%;
  display: block;
  object-fit: cover;
  border-radius: 2px;
}

/* 拍立得底部标签 */
.polaroid-label {
  padding: 10px 4px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.polaroid-title {
  font-size: var(--text-sm);
  font-weight: 500;
  color: #2c2420;
  letter-spacing: var(--tracking-normal);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--font-serif);
}
.scatter-container.dark .polaroid-title {
  color: #e8ddd0;
}
.polaroid-date {
  font-size: var(--text-xs);
  color: #8a7e74;
  font-style: italic;
  letter-spacing: var(--tracking-wide);
}

/* 悬浮时显示地点 */
.overlay {
  position: absolute;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 14px;
  background: rgba(44, 36, 32, 0.85);
  backdrop-filter: blur(8px);
  color: #fff;
  border-radius: 20px;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.4s, transform 0.4s;
  white-space: nowrap;
  pointer-events: none;
  transform: translateX(-50%) translateY(6px);
}
.scatter-item:hover .overlay {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

/* 缓慢漂浮动画 */
@keyframes gentleFloat {
  0%, 100% {
    transform: rotate(var(--rotate, 0deg)) translateY(0);
  }
  25% {
    transform: rotate(var(--rotate, 0deg)) translateY(-6px) translateX(3px);
  }
  50% {
    transform: rotate(var(--rotate, 0deg)) translateY(-2px) translateX(-2px);
  }
  75% {
    transform: rotate(var(--rotate, 0deg)) translateY(-8px) translateX(1px);
  }
}
</style>
