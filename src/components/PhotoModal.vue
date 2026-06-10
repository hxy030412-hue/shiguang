<template>
  <Teleport to="body">
    <div
      class="modal-mask"
      :class="{ 'mask-visible': phase >= 1, 'mask-full': phase >= 2 }"
      @click.self="close"
    >
      <div class="modal-shell" ref="shellEl" :style="shellStyle">
        <!-- 照片主体 -->
        <div class="photo-stage" ref="photoEl">
          <img :src="photo.url" :alt="photo.title" :style="imgStyle" />
          <!-- 标题浮层 — 展开时显示 -->
          <div class="photo-title-float" :class="{ show: phase >= 2 }">
            <span>{{ photo.title }}</span>
          </div>
        </div>

        <!-- 信息面板 -->
        <div class="info-panel" :class="{ 'info-visible': phase >= 2 }">
          <button class="close-btn" @click="close">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M1 1L17 17M17 1L1 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>

          <div class="info-scroll">
            <h2 class="info-title">{{ photo.title }}</h2>

            <div class="meta-row">
              <div class="meta-item" v-if="photo.date">
                <span class="meta-icon">📅</span>
                <span>{{ photo.date }}</span>
              </div>
              <div class="meta-item" v-if="photo.location">
                <span class="meta-icon">📍</span>
                <span>{{ photo.location }}</span>
              </div>
              <div class="meta-item" v-if="photo.people">
                <span class="meta-icon">👥</span>
                <span>{{ photo.people }}</span>
              </div>
            </div>

            <div class="story" v-if="photo.story">
              <p>{{ photo.story }}</p>
            </div>

            <button class="export-btn" @click="exportCard">
              <span>导出回忆卡</span>
            </button>

            <button class="archive-btn" @click="showArchiveConfirm = true">
              <span>📦 收进时光盒</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 归档确认弹窗 -->
    <Transition name="confirm-fade">
      <div v-if="showArchiveConfirm" class="confirm-mask" @click.self="showArchiveConfirm = false">
        <div class="confirm-dialog">
          <h3>收进时光盒</h3>
          <p>这段回忆将从回忆馆暂时隐藏。</p>
          <p>你随时都可以在「时光盒」中重新找回它。</p>
          <div class="confirm-actions">
            <button class="confirm-cancel" @click="showArchiveConfirm = false">取消</button>
            <button class="confirm-archive" @click="doArchive">收进时光盒</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 明信片模板 -->
    <div class="postcard-template" ref="postcardEl">
      <div class="postcard-photo">
        <img :src="photo.url" crossorigin="anonymous" />
      </div>
      <div class="postcard-body">
        <h2>{{ photo.title }}</h2>
        <div class="postcard-meta">
          <span>{{ photo.date }}</span>
          <span>{{ photo.location }}</span>
        </div>
        <p class="postcard-story">{{ photo.story }}</p>
        <div class="postcard-footer">✨ 拾光 · 记录值得被记住的瞬间</div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import html2canvas from 'html2canvas'
import { api } from '../api'

const props = defineProps({
  photo: Object,
  originRect: Object
})
const emit = defineEmits(['close', 'archive-photo'])

const shellEl = ref(null)
const photoEl = ref(null)
const postcardEl = ref(null)
const phase = ref(0)
const closing = ref(false)
const imgRevealed = ref(false)
const showArchiveConfirm = ref(false)
const archiving = ref(false)

const EASE_EXPAND = 'cubic-bezier(0.16, 1, 0.3, 1)'
const EASE_CLOSE = 'cubic-bezier(0.4, 0, 0.2, 1)'

const shellStyle = computed(() => {
  if (!props.originRect) return {}
  const r = props.originRect

  if (phase.value === 0) {
    return {
      left: r.left + 'px',
      top: r.top + 'px',
      width: r.width + 'px',
      height: r.height + 'px',
      borderRadius: '6px',
      opacity: '1',
      transform: 'scale(1)'
    }
  }
  if (phase.value === 1) {
    return {
      left: '50%',
      top: '50%',
      width: '92vw',
      maxWidth: '1100px',
      height: '88vh',
      borderRadius: '16px',
      opacity: '1',
      transform: 'translate(-50%, -50%) scale(1)',
      transition: `left 0.7s ${EASE_EXPAND}, top 0.7s ${EASE_EXPAND}, width 0.7s ${EASE_EXPAND}, height 0.7s ${EASE_EXPAND}, border-radius 0.7s ${EASE_EXPAND}, opacity 0.3s ease, transform 0.7s ${EASE_EXPAND}`
    }
  }
  return {
    left: '50%',
    top: '50%',
    width: '92vw',
    maxWidth: '1100px',
    height: '88vh',
    borderRadius: '16px',
    opacity: '1',
    transform: 'translate(-50%, -50%) scale(1)'
  }
})

const imgStyle = computed(() => {
  if (archiving.value) {
    return {
      opacity: '0',
      transform: 'scale(0.92)',
      filter: 'blur(4px)',
      transition: 'opacity 0.3s ease, transform 0.3s ease, filter 0.3s ease'
    }
  }
  if (phase.value < 2) {
    return {
      opacity: '0',
      transform: 'translateY(12px)',
      transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.16,1,0.3,1)'
    }
  }
  return {
    opacity: '1',
    transform: 'translateY(0)',
    transition: 'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)'
  }
})

onMounted(async () => {
  if (!props.originRect) {
    phase.value = 2
    imgRevealed.value = true
    return
  }
  document.body.style.overflow = 'hidden'
  await nextTick()
  shellEl.value?.offsetHeight

  requestAnimationFrame(() => {
    phase.value = 1
    setTimeout(() => {
      phase.value = 2
      setTimeout(() => { imgRevealed.value = true }, 300)
    }, 600)
  })
})

function close() {
  if (closing.value) return
  closing.value = true

  if (props.originRect && shellEl.value) {
    const r = props.originRect
    phase.value = 1
    imgRevealed.value = false

    setTimeout(() => {
      const el = shellEl.value
      el.style.transition = `left 0.5s ${EASE_CLOSE}, top 0.5s ${EASE_CLOSE}, width 0.5s ${EASE_CLOSE}, height 0.5s ${EASE_CLOSE}, border-radius 0.5s ${EASE_CLOSE}, opacity 0.4s ease 0.1s, transform 0.5s ${EASE_CLOSE}`
      el.style.left = r.left + 'px'
      el.style.top = r.top + 'px'
      el.style.width = r.width + 'px'
      el.style.height = r.height + 'px'
      el.style.borderRadius = '6px'
      el.style.transform = 'scale(1)'
      el.style.opacity = '0'
      setTimeout(() => emit('close'), 500)
    }, 150)
  } else {
    emit('close')
  }
}

async function doArchive() {
  showArchiveConfirm.value = false
  archiving.value = true

  try {
    await api.archivePhoto(props.photo.id, true)
    // 播放淡出动画后关闭
    setTimeout(() => {
      emit('archive-photo', props.photo.id)
      emit('close')
    }, 350)
  } catch (e) {
    console.error('归档失败:', e)
    archiving.value = false
  }
}

async function exportCard() {
  if (!postcardEl.value) return
  const canvas = await html2canvas(postcardEl.value, {
    useCORS: true,
    scale: 2,
    backgroundColor: '#fff'
  })
  const link = document.createElement('a')
  link.download = `${props.photo.title}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 200;
  opacity: 0;
  background: rgba(10, 8, 6, 0);
  transition: opacity 0.4s ease, background 0.6s ease;
  backdrop-filter: blur(0px);
  -webkit-backdrop-filter: blur(0px);
}
.modal-mask.mask-visible {
  opacity: 1;
  background: rgba(10, 8, 6, 0.45);
  backdrop-filter: blur(12px) saturate(1.1);
  -webkit-backdrop-filter: blur(12px) saturate(1.1);
}
.modal-mask.mask-full {
  background: rgba(10, 8, 6, 0.65);
  backdrop-filter: blur(20px) saturate(1.2);
  -webkit-backdrop-filter: blur(20px) saturate(1.2);
  transition: opacity 0.3s ease, background 0.8s ease, backdrop-filter 0.8s ease;
}

.modal-shell {
  position: fixed;
  overflow: hidden;
  display: flex;
  z-index: 201;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.15),
    0 16px 60px rgba(0, 0, 0, 0.2),
    0 32px 100px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.06);
}

/* 照片区域 */
.photo-stage {
  flex: 1;
  min-width: 0;
  position: relative;
  overflow: hidden;
  background: #0a0a0a;
  display: flex;
  align-items: center;
  justify-content: center;
}
.photo-stage img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
  will-change: opacity, transform, filter;
}

/* 标题浮层 */
.photo-title-float {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 60px 32px 24px;
  background: linear-gradient(transparent, rgba(0,0,0,0.5));
  color: #fff;
  font-size: var(--text-xl);
  font-weight: 400;
  font-family: var(--font-serif);
  letter-spacing: var(--tracking-wide);
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.6s ease 0.1s, transform 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s;
  pointer-events: none;
}
.photo-title-float.show {
  opacity: 1;
  transform: translateY(0);
}

/* 信息面板 */
.info-panel {
  flex: 0 0 340px;
  background: var(--surface-solid);
  display: flex;
  flex-direction: column;
  position: relative;
  opacity: 0;
  transform: translateX(40px);
  transition: opacity 0.6s ease 0.05s, transform 0.7s cubic-bezier(0.16,1,0.3,1) 0.05s;
}
.info-panel.info-visible {
  opacity: 1;
  transform: translateX(0);
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: var(--input-bg);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted);
  z-index: 10;
  transition: all 0.3s;
  opacity: 0;
  transform: scale(0.8);
}
.info-visible .close-btn {
  opacity: 1;
  transform: scale(1);
  transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.3s;
}
.close-btn:hover {
  background: var(--accent-glow);
  border-color: var(--accent);
  color: var(--accent);
  transform: scale(1.08) !important;
}

.info-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 36px 28px;
}

.info-title {
  margin: 0 0 24px;
  font-size: var(--text-2xl);
  font-weight: 500;
  font-family: var(--font-serif);
  color: var(--text);
  letter-spacing: var(--tracking-normal);
  line-height: var(--leading-tight);
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.5s ease 0.2s, transform 0.5s cubic-bezier(0.16,1,0.3,1) 0.2s;
}
.info-visible .info-title {
  opacity: 1;
  transform: translateY(0);
}

.meta-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.5s ease 0.3s, transform 0.5s cubic-bezier(0.16,1,0.3,1) 0.3s;
}
.info-visible .meta-row {
  opacity: 1;
  transform: translateY(0);
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--text-secondary);
}
.meta-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.story {
  padding-top: 24px;
  border-top: 1px solid var(--border);
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.5s ease 0.4s, transform 0.5s cubic-bezier(0.16,1,0.3,1) 0.4s;
}
.info-visible .story {
  opacity: 1;
  transform: translateY(0);
}
.story p {
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  color: var(--text-secondary);
  margin: 0;
  letter-spacing: var(--tracking-normal);
  font-family: var(--font-serif);
}

.export-btn {
  margin-top: 28px;
  width: 100%;
  padding: 14px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 16px var(--accent-glow);
  letter-spacing: 0.02em;
  opacity: 0;
  transform: translateY(12px);
}
.info-visible .export-btn {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.5s ease 0.5s, transform 0.5s cubic-bezier(0.16,1,0.3,1) 0.5s, background 0.3s, box-shadow 0.3s;
}
.export-btn:hover {
  background: var(--accent-hover);
  box-shadow: 0 4px 24px var(--accent-glow);
  transform: translateY(-1px) !important;
}

/* 归档按钮 */
.archive-btn {
  margin-top: 12px;
  width: 100%;
  padding: 12px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.3s;
  letter-spacing: 0.02em;
  opacity: 0;
  transform: translateY(12px);
}
.info-visible .archive-btn {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.5s ease 0.55s, transform 0.5s cubic-bezier(0.16,1,0.3,1) 0.55s, border-color 0.3s, color 0.3s;
}
.archive-btn:hover {
  border-color: var(--text-muted);
  color: var(--text-secondary);
}

/* 确认弹窗 */
.confirm-mask {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(10, 8, 6, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.confirm-dialog {
  background: var(--surface-solid);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: 36px;
  width: 380px;
  max-width: 90%;
  box-shadow: var(--shadow-lg);
  text-align: center;
}
.confirm-dialog h3 {
  margin: 0 0 16px;
  font-size: var(--text-xl);
  font-weight: 500;
  font-family: var(--font-serif);
  color: var(--text);
}
.confirm-dialog p {
  margin: 0 0 8px;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
}
.confirm-actions {
  display: flex;
  gap: 12px;
  margin-top: 28px;
}
.confirm-cancel {
  flex: 1;
  padding: 12px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.3s;
}
.confirm-cancel:hover {
  border-color: var(--text-muted);
  color: var(--text-secondary);
}
.confirm-archive {
  flex: 1;
  padding: 12px;
  background: var(--accent);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 12px var(--accent-glow);
}
.confirm-archive:hover {
  background: var(--accent-hover);
  box-shadow: 0 4px 20px var(--accent-glow);
}

/* 确认弹窗动画 */
.confirm-fade-enter-active {
  transition: opacity 0.25s ease;
}
.confirm-fade-leave-active {
  transition: opacity 0.2s ease;
}
.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}

/* 明信片导出模板 */
.postcard-template {
  position: fixed;
  left: -9999px;
  top: 0;
  width: 600px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.postcard-photo img {
  width: 100%;
  height: 360px;
  object-fit: cover;
  display: block;
}
.postcard-body {
  padding: 28px 32px;
}
.postcard-body h2 {
  margin: 0 0 12px;
  font-size: 22px;
  color: #2c2420;
}
.postcard-meta {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #8a7e74;
  margin-bottom: 16px;
}
.postcard-story {
  font-size: 15px;
  line-height: 1.8;
  color: #5a4e44;
  margin: 0 0 20px;
}
.postcard-footer {
  text-align: right;
  font-size: 13px;
  color: #bbb;
  border-top: 1px solid #eee;
  padding-top: 12px;
}
</style>
