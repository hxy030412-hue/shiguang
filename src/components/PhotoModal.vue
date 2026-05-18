<template>
  <Teleport to="body">
    <div class="modal-mask" @click.self="close">
      <div class="modal-content" :style="modalStyle" ref="modalEl">
        <button class="close-btn" @click="close">×</button>
        <div class="photo-section">
          <img :src="photo.url" :alt="photo.title" />
        </div>
        <div class="info-section">
          <h2>{{ photo.title }}</h2>
          <div class="info-item">
            <span class="icon">📅</span>
            <span>{{ photo.date }}</span>
          </div>
          <div class="info-item">
            <span class="icon">📍</span>
            <span>{{ photo.location }}</span>
          </div>
          <div class="info-item">
            <span class="icon">👥</span>
            <span>{{ photo.people }}</span>
          </div>
          <div class="story">
            <p>{{ photo.story }}</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'

const props = defineProps({
  photo: Object,
  originRect: Object
})
const emit = defineEmits(['close'])

const modalEl = ref(null)
const animating = ref(true)

const modalStyle = computed(() => {
  if (!animating.value || !props.originRect) return {}
  const r = props.originRect
  return {
    position: 'fixed',
    left: r.left + 'px',
    top: r.top + 'px',
    width: r.width + 'px',
    height: r.height + 'px',
    opacity: '0.6',
    borderRadius: '10px',
    transition: 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  }
})

onMounted(async () => {
  if (!props.originRect) {
    animating.value = false
    return
  }
  await nextTick()
  // 强制浏览器记录初始位置
  modalEl.value?.offsetHeight
  // 动画到最终位置
  requestAnimationFrame(() => {
    if (modalEl.value) {
      modalEl.value.style.left = '50%'
      modalEl.value.style.top = '50%'
      modalEl.value.style.width = '90%'
      modalEl.value.style.maxWidth = '900px'
      modalEl.value.style.height = 'auto'
      modalEl.value.style.maxHeight = '85vh'
      modalEl.value.style.opacity = '1'
      modalEl.value.style.borderRadius = '16px'
      modalEl.value.style.transform = 'translate(-50%, -50%)'
    }
    setTimeout(() => { animating.value = false }, 500)
  })
})

function close() {
  if (props.originRect && modalEl.value) {
    const r = props.originRect
    modalEl.value.style.transition = 'all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    modalEl.value.style.left = r.left + 'px'
    modalEl.value.style.top = r.top + 'px'
    modalEl.value.style.width = r.width + 'px'
    modalEl.value.style.height = r.height + 'px'
    modalEl.value.style.opacity = '0'
    modalEl.value.style.borderRadius = '10px'
    modalEl.value.style.transform = 'none'
    setTimeout(() => emit('close'), 350)
  } else {
    emit('close')
  }
}
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 200;
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  max-width: 900px;
  width: 90%;
  max-height: 85vh;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 16px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 22px;
  cursor: pointer;
  z-index: 10;
  transition: background 0.3s;
}
.close-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

.photo-section {
  flex: 1;
  min-width: 0;
}
.photo-section img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.info-section {
  flex: 0 0 320px;
  padding: 32px 24px;
  overflow-y: auto;
}
.info-section h2 {
  margin: 0 0 20px;
  font-size: 22px;
  color: #2c3e50;
}
.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  font-size: 15px;
  color: #555;
}
.icon {
  font-size: 18px;
}
.story {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}
.story p {
  font-size: 15px;
  line-height: 1.8;
  color: #444;
  margin: 0;
}
</style>
