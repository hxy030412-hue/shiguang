<template>
  <div
    ref="containerEl"
    class="scatter-container"
    :class="{ dark: darkMode, 'edit-mode': editMode }"
    @mousemove="onMouseMove"
  >
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

    <!-- 编辑模式提示条 -->
    <Transition name="edit-bar">
      <div v-if="editMode" class="edit-bar">
        <div class="edit-bar-left">
          <Transition name="status-fade" mode="out-in">
            <span v-if="saveStatus === 'saving'" key="saving" class="edit-bar-status saving">
              <span class="status-dot saving-dot"></span>
              保存中…
            </span>
            <span v-else-if="saveStatus === 'saved'" key="saved" class="edit-bar-status saved">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              已自动保存
            </span>
            <span v-else-if="saveStatus === 'error'" key="error" class="edit-bar-status error">
              ⚠️ 保存失败，请重试
            </span>
            <span v-else key="idle" class="edit-bar-status idle">
              ✏️ 正在整理回忆馆
            </span>
          </Transition>
        </div>
        <button class="edit-bar-btn" @click="$emit('reset-layout')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
          重置布局
        </button>
      </div>
    </Transition>

    <div
      v-for="(photo, index) in positionedPhotos"
      :key="photo.id"
      class="scatter-item"
      :class="{
        'is-dragging': dragState?.photo.id === photo.id,
        'is-hidden': selectedPhotoId === photo.id,
        'is-pinned': photo.is_pinned
      }"
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
      <!-- 置顶标记 -->
      <div v-if="photo.is_pinned" class="pin-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  photos: Array,
  darkMode: Boolean,
  selectedPhotoId: Number,
  layoutMap: Object,
  editMode: Boolean
})
const emit = defineEmits(['select-photo', 'save-layout', 'reset-layout'])

const glowEl = ref(null)
const containerEl = ref(null)
const photoEls = ref({})
const positionedPhotos = ref([])
const dragState = ref(null)
const saveStatus = ref('idle') // idle | saving | saved | error
let maxZ = 50
let statusTimer = null
let isDragging = false

// 防抖保存
let saveTimer = null
const pendingSaves = new Map()

function setStatus(status, duration = 2000) {
  saveStatus.value = status
  if (statusTimer) clearTimeout(statusTimer)
  if (duration > 0) {
    statusTimer = setTimeout(() => { saveStatus.value = 'idle' }, duration)
  }
}

function scheduleSave(photoId, data) {
  pendingSaves.set(photoId, data)
  if (saveTimer) clearTimeout(saveTimer)
  setStatus('saving', 0)
  saveTimer = setTimeout(() => {
    const layouts = Array.from(pendingSaves.entries()).map(([photo_id, d]) => ({
      photo_id, ...d
    }))
    pendingSaves.clear()
    emit('save-layout', layouts)
    setTimeout(() => {
      if (saveStatus.value === 'saving') {
        setStatus('saved')
      }
    }, 800)
  }, 500)
}

function onMouseMove(e) {
  if (glowEl.value) {
    glowEl.value.style.left = e.clientX + 'px'
    glowEl.value.style.top = e.clientY + 'px'
  }
}

function onPhotoHover(photo) {
  if (isDragging) return
  maxZ++
  photo.z = maxZ
}

let clickState = null
let lastMouse = { x: 0, y: 0 }

function getContainerRect() {
  return containerEl.value?.getBoundingClientRect() || { left: 0, top: 0 }
}

function onDragStart(e, photo) {
  // 非编辑模式：只允许点击
  if (!props.editMode) {
    e.preventDefault()
    const el = photoEls.value[photo.id]
    clickState = { photo, startTime: Date.now(), sx: e.clientX, sy: e.clientY }
    lastMouse = { x: e.clientX, y: e.clientY }
    dragState.value = { photo, startX: 0, startY: 0, el, clickOnly: true }
    document.addEventListener('mouseup', onDragEnd)
    return
  }

  e.preventDefault()
  isDragging = true
  maxZ++
  photo.z = maxZ

  const el = photoEls.value[photo.id]
  const containerRect = getContainerRect()
  // 鼠标相对于容器的偏移
  const mouseXInContainer = e.clientX - containerRect.left
  const mouseYInContainer = e.clientY - containerRect.top
  const offsetX = mouseXInContainer - photo.x
  const offsetY = mouseYInContainer - photo.y

  clickState = { photo, startTime: Date.now(), sx: e.clientX, sy: e.clientY }
  lastMouse = { x: e.clientX, y: e.clientY }
  dragState.value = { photo, offsetX, offsetY, el, clickOnly: false }

  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
  document.addEventListener('mouseleave', onDragEnd)
}

function onDragMove(e) {
  if (!dragState.value || dragState.value.clickOnly) return
  e.preventDefault()
  lastMouse = { x: e.clientX, y: e.clientY }

  const { photo, offsetX, offsetY } = dragState.value
  const containerRect = getContainerRect()
  const containerW = containerEl.value?.clientWidth || 1200

  // 鼠标相对于容器的位置 - 偏移量 = 照片新位置
  let newX = e.clientX - containerRect.left - offsetX
  let newY = e.clientY - containerRect.top - offsetY

  // 边界 clamp
  const margin = 20
  newX = Math.max(margin, Math.min(containerW - photo.w - margin, newX))
  newY = Math.max(margin, newY)

  photo.x = newX
  photo.y = newY
}

function onDragEnd() {
  if (!dragState.value) return
  const { el, photo, clickOnly } = dragState.value

  const dt = Date.now() - clickState.startTime
  const dx = Math.abs(lastMouse.x - clickState.sx)
  const dy = Math.abs(lastMouse.y - clickState.sy)

  // 点击判定
  if (dt < 250 && dx < 5 && dy < 5) {
    const rect = el.getBoundingClientRect()
    emit('select-photo', { photo: clickState.photo, rect })
  }
  // 拖拽结束 → 保存
  else if (!clickOnly) {
    scheduleSave(photo.id, {
      x: Math.round(photo.x),
      y: Math.round(photo.y),
      rotate: photo.rotate,
      z_index: photo.z,
      scale: 1,
      is_pinned: photo.is_pinned ? 1 : 0
    })
  }

  // 先清除 dragState，再解除 isDragging（让 watch 可以下一轮执行）
  dragState.value = null
  clickState = null
  // 延迟一帧解除，避免 watch 立即触发 calcPositions 覆盖刚放下的位置
  requestAnimationFrame(() => { isDragging = false })

  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('mouseleave', onDragEnd)
}

// 响应式尺寸配置
function getSizeConfig(cw) {
  if (cw < 1400) return { minW: 180, maxW: 280, imgRatio: 0.75 }
  if (cw < 2000) return { minW: 220, maxW: 340, imgRatio: 0.72 }
  return { minW: 260, maxW: 420, imgRatio: 0.7 }
}

// 有机散落布局 — 优先用持久化数据，否则随机生成（基于 photo.id）
function calcPositions(skipDragged = true) {
  const container = containerEl.value
  if (!container || !props.photos.length) return

  const cw = container.clientWidth
  const ch = container.clientHeight || window.innerHeight
  const photos = props.photos
  const placed = []
  const { minW, maxW, imgRatio } = getSizeConfig(cw)

  function seeded(id, seed) {
    const x = Math.sin(id * 9301 + seed * 49297) * 49297
    return x - Math.floor(x)
  }

  function getCardWidth(id) {
    const roll = seeded(id, 1)
    const range = maxW - minW
    // 三档分布，中间档更多
    if (roll < 0.25) return minW
    if (roll < 0.65) return minW + range * 0.5
    return maxW
  }

  // 拖拽中的照片保留当前位置
  const draggedId = dragState.value?.photo?.id

  const newPos = photos.map((photo) => {
    // 拖拽中的照片不重算
    if (skipDragged && photo.id === draggedId) {
      const existing = positionedPhotos.value.find(p => p.id === photo.id)
      if (existing) {
        placed.push({ x: existing.x, y: existing.y, w: existing.w })
        return existing
      }
    }

    const w = getCardWidth(photo.id)
    const imgH = Math.round(w * imgRatio)

    // 优先使用持久化布局
    const saved = props.layoutMap?.[photo.id]
    if (saved) {
      placed.push({ x: saved.x, y: saved.y, w })
      return {
        ...photo,
        x: saved.x,
        y: saved.y,
        w,
        imgH,
        rotate: saved.rotate,
        z: saved.z_index,
        is_pinned: saved.is_pinned
      }
    }

    // 无持久化 → 随机生成（基于 photo.id）
    const rotBase = (seeded(photo.id, 2) - 0.5) * 20
    const rotate = Math.round(rotBase * 10) / 10

    const margin = Math.max(30, cw * 0.02)
    const usableW = cw - w - margin * 2
    const usableH = ch - w * imgRatio - margin

    // 全范围分布，不再限制 60%
    let bestX = margin + seeded(photo.id, 3) * usableW
    let bestY = margin + seeded(photo.id, 4) * usableH

    // 超宽屏：允许向两侧扩散更多
    if (cw > 2000) {
      const spreadBoost = (cw - 2000) / 2000 * 0.3
      bestX = margin + seeded(photo.id, 3) * (usableW * (1 + spreadBoost))
      bestX = Math.max(margin, Math.min(cw - w - margin, bestX))
    }

    // 多轮排斥，降低重叠
    for (let round = 0; round < 5; round++) {
      for (const p of placed) {
        const dx = bestX - p.x
        const dy = bestY - p.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const minDist = (w + p.w) * 0.42
        if (dist < minDist) {
          const push = (minDist - dist) * 0.5
          bestX += (dx / dist) * push
          bestY += (dy / dist) * push
        }
      }
    }

    bestX = Math.max(margin, Math.min(cw - w - margin, bestX))
    bestY = Math.max(margin, bestY)

    placed.push({ x: bestX, y: bestY, w })

    const z = Math.floor(seeded(photo.id, 5) * 15) + 1

    return { ...photo, x: bestX, y: bestY, w, imgH, rotate, z, is_pinned: 0 }
  })

  positionedPhotos.value = newPos

  // 动态撑高容器（拖拽中不修改）
  if (!isDragging) {
    const maxY = Math.max(...placed.map(p => p.y + 350))
    container.style.minHeight = maxY + 'px'
  }
}

// ResizeObserver
let resizeObserver = null

function setupResizeObserver() {
  if (!containerEl.value) return
  resizeObserver = new ResizeObserver(() => {
    if (isDragging) return
    calcPositions()
  })
  resizeObserver.observe(containerEl.value)
}

// 首次布局：等 DOM 挂载完成后再计算
onMounted(async () => {
  await nextTick()
  if (containerEl.value && props.photos.length) {
    calcPositions()
    setupResizeObserver()
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

// 响应式更新：photos 或 layoutMap 变化时重算
watch(() => [props.photos, props.layoutMap], async () => {
  if (isDragging) return
  await nextTick()
  if (containerEl.value) {
    calcPositions()
  }
}, { deep: true })
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
.scatter-container.dark {
  background: transparent;
}

/* 编辑模式光标 */
.scatter-container.edit-mode {
  cursor: crosshair;
}

/* 编辑模式提示条 */
.edit-bar {
  position: fixed;
  top: 64px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 95;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 10px 24px;
  background: var(--surface);
  backdrop-filter: blur(20px) saturate(1.2);
  -webkit-backdrop-filter: blur(20px) saturate(1.2);
  border: 1px solid var(--glass-border);
  border-radius: 24px;
  box-shadow: var(--shadow-md);
}
.edit-bar-left {
  flex: 1;
  min-width: 140px;
}
.edit-bar-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.edit-bar-status.idle {
  color: var(--text-secondary);
}
.edit-bar-status.saving {
  color: var(--text-muted);
}
.edit-bar-status.saved {
  color: var(--success);
}
.edit-bar-status.error {
  color: var(--error);
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}
.saving-dot {
  background: var(--accent);
  animation: dotPulse 1s ease-in-out infinite;
}
@keyframes dotPulse {
  0%, 100% { opacity: 0.4; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}
.edit-bar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
  letter-spacing: 0.02em;
}
.edit-bar-btn:hover {
  border-color: var(--error);
  color: var(--error);
  background: rgba(204, 68, 68, 0.06);
}

.edit-bar-enter-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.edit-bar-leave-active {
  transition: all 0.25s ease;
}
.edit-bar-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-12px);
}
.edit-bar-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px);
}

/* 状态文案切换动画 */
.status-fade-enter-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.status-fade-leave-active {
  transition: all 0.15s ease;
}
.status-fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.status-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
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
  width: 180px; height: 180px;
  border-radius: 50%;
  pointer-events: none;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(255,220,150,0.1) 0%, rgba(255,200,120,0.04) 35%, transparent 70%);
  mix-blend-mode: soft-light;
  transition: left 0.2s ease-out, top 0.2s ease-out;
  z-index: 4;
  left: -300px; top: -300px;
}
.scatter-container.dark .cursor-glow {
  width: 200px; height: 200px;
  background: radial-gradient(circle, rgba(255,210,130,0.2) 0%, rgba(255,180,100,0.08) 30%, transparent 65%);
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
  transition: box-shadow 0.5s, left 0.08s linear, top 0.08s linear;
  animation: gentleFloat var(--float-duration) ease-in-out infinite;
  animation-delay: var(--float-delay);
}
.scatter-item:active { cursor: grabbing; }
.scatter-item.is-dragging {
  animation: none !important;
  transition: box-shadow 0.3s;
  cursor: grabbing;
}
.scatter-item.is-hidden {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}

/* 非编辑模式下卡片不可拖拽 */
.scatter-container:not(.edit-mode) .scatter-item {
  cursor: pointer;
}

.card-inner {
  background: #fffcf7;
  border-radius: 4px;
  padding: 10px 10px 0;
  box-shadow:
    0 1px 4px rgba(60, 44, 28, 0.06),
    0 4px 16px rgba(60, 44, 28, 0.05),
    0 12px 40px rgba(60, 44, 28, 0.04);
  transition: box-shadow 0.5s, transform 0.5s;
  overflow: hidden;
}
.scatter-container.dark .card-inner {
  background: #28221c;
  box-shadow:
    0 2px 8px rgba(0,0,0,0.2),
    0 8px 24px rgba(0,0,0,0.15),
    0 0 0 1px rgba(212, 160, 106, 0.04);
}

.scatter-item:hover .card-inner {
  box-shadow:
    0 2px 8px rgba(60, 44, 28, 0.08),
    0 8px 28px rgba(60, 44, 28, 0.08),
    0 20px 56px rgba(60, 44, 28, 0.06);
  transform: scale(1.03);
}
.scatter-container.dark .scatter-item:hover .card-inner {
  box-shadow:
    0 4px 16px rgba(0,0,0,0.3),
    0 12px 40px rgba(0,0,0,0.25),
    0 0 0 1px rgba(255,200,120,0.08);
}

/* 非编辑模式 hover 上浮 */
.scatter-container:not(.edit-mode) .scatter-item:hover {
  transform: rotate(0deg) translateY(-4px);
  z-index: 999;
}

/* 编辑模式 hover 只提升 z-index，不位移 */
.scatter-container.edit-mode .scatter-item:hover:not(.is-dragging) {
  transform: rotate(0deg);
  z-index: 999;
}

/* 编辑模式拖拽中 */
.scatter-container.edit-mode .scatter-item.is-dragging {
  z-index: 9999;
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

/* 置顶标记 */
.pin-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(194, 122, 62, 0.3);
  z-index: 10;
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
