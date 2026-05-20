<template>
  <Teleport to="body">
    <div
      class="modal-mask"
      :class="{ 'mask-visible': phase >= 1, 'mask-full': phase >= 2 }"
      @click.self="close"
    >
      <div class="modal-shell" ref="shellEl" :style="shellStyle">
        <!-- 照片主体 -->
        <div class="photo-stage" ref="photoEl" :style="photoStyle">
          <img :src="photo.url" :alt="photo.title" />
        </div>

        <!-- 信息面板 -->
        <div class="info-panel" :class="{ 'info-visible': phase >= 2 }">
          <button class="close-btn" @click="close">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M1 1L17 17M17 1L1 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>

          <div class="info-scroll">
            <h2>{{ photo.title }}</h2>

            <div class="meta-row">
              <div class="meta-item">
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
              <span>导出明信片</span>
            </button>
          </div>
        </div>
      </div>
    </div>

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
        <div class="postcard-footer">📷 拾光</div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import html2canvas from 'html2canvas'

const props = defineProps({
  photo: Object,
  originRect: Object
})
const emit = defineEmits(['close'])

const shellEl = ref(null)
const photoEl = ref(null)
const postcardEl = ref(null)
const phase = ref(0) // 0=init, 1=expanding, 2=settled
const closing = ref(false)

// Apple-style easing: fast start, gentle deceleration with slight overshoot
const EASE_OUT = 'cubic-bezier(0.2, 0.8, 0.15, 1)'
const EASE_IN_OUT = 'cubic-bezier(0.4, 0, 0.1, 1)'

const shellStyle = computed(() => {
  if (!props.originRect) return {}
  const r = props.originRect

  if (phase.value === 0) {
    // 起始：卡片位置
    return {
      left: r.left + 'px',
      top: r.top + 'px',
      width: r.width + 'px',
      height: r.height + 'px',
      borderRadius: '8px',
      opacity: '1'
    }
  }
  if (phase.value === 1) {
    // 展开中：飞向中心
    return {
      left: '50%',
      top: '50%',
      width: '92vw',
      maxWidth: '1100px',
      height: '88vh',
      borderRadius: '16px',
      opacity: '1',
      transform: 'translate(-50%, -50%)',
      transition: `all 0.65s ${EASE_OUT}`
    }
  }
  // settled
  return {
    left: '50%',
    top: '50%',
    width: '92vw',
    maxWidth: '1100px',
    height: '88vh',
    borderRadius: '16px',
    opacity: '1',
    transform: 'translate(-50%, -50%)'
  }
})

const photoStyle = computed(() => {
  if (phase.value < 2) return { opacity: '1' }
  return {
    opacity: '1',
    transition: 'opacity 0.4s ease'
  }
})

onMounted(async () => {
  if (!props.originRect) {
    phase.value = 2
    return
  }
  await nextTick()
  // 让浏览器记录起始位置
  shellEl.value?.offsetHeight

  requestAnimationFrame(() => {
    phase.value = 1
    // 展开动画完成后显示信息面板
    setTimeout(() => {
      phase.value = 2
    }, 500)
  })
})

function close() {
  if (closing.value) return
  closing.value = true

  if (props.originRect && shellEl.value) {
    const r = props.originRect
    // 先隐藏信息面板
    phase.value = 1

    setTimeout(() => {
      // 缩回卡片位置
      shellEl.value.style.transition = `all 0.45s ${EASE_IN_OUT}`
      shellEl.value.style.left = r.left + 'px'
      shellEl.value.style.top = r.top + 'px'
      shellEl.value.style.width = r.width + 'px'
      shellEl.value.style.height = r.height + 'px'
      shellEl.value.style.borderRadius = '8px'
      shellEl.value.style.transform = 'none'
      shellEl.value.style.opacity = '0'

      setTimeout(() => emit('close'), 450)
    }, 200)
  } else {
    emit('close')
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
  transition: opacity 0.4s ease;
  background: rgba(10, 8, 6, 0);
}
.modal-mask.mask-visible {
  opacity: 1;
  background: rgba(10, 8, 6, 0.55);
}
.modal-mask.mask-full {
  background: rgba(10, 8, 6, 0.7);
  transition: opacity 0.3s ease, background 0.5s ease;
}

.modal-shell {
  position: fixed;
  overflow: hidden;
  display: flex;
  box-shadow:
    0 8px 40px rgba(0, 0, 0, 0.2),
    0 24px 80px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.06);
}

/* 照片区域 */
.photo-stage {
  flex: 1;
  min-width: 0;
  position: relative;
  overflow: hidden;
  background: #111;
}
.photo-stage img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 信息面板 */
.info-panel {
  flex: 0 0 340px;
  background: var(--surface-solid);
  display: flex;
  flex-direction: column;
  position: relative;
  opacity: 0;
  transform: translateX(30px);
  transition: opacity 0.5s ease 0.1s, transform 0.5s cubic-bezier(0.2, 0.8, 0.15, 1) 0.1s;
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
}
.close-btn:hover {
  background: var(--accent-glow);
  border-color: var(--accent);
  color: var(--accent);
}

.info-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 36px 28px;
}

.info-scroll h2 {
  margin: 0 0 24px;
  font-size: 24px;
  font-weight: 600;
  color: var(--text);
  letter-spacing: 0.01em;
  line-height: 1.3;
}

.meta-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
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
}
.story p {
  font-size: 15px;
  line-height: 1.85;
  color: var(--text-secondary);
  margin: 0;
  letter-spacing: 0.01em;
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
}
.export-btn:hover {
  background: var(--accent-hover);
  box-shadow: 0 4px 24px var(--accent-glow);
  transform: translateY(-1px);
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
