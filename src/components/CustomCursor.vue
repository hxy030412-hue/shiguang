<template>
  <div class="cursor-fx">
    <div
      class="cursor-ring"
      ref="ring"
      :class="{ 'ring-near': nearPhoto, 'ring-click': clicking }"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const ring = ref(null)
const nearPhoto = ref(false)
const clicking = ref(false)

let mouseX = -100, mouseY = -100
let ringX = -100, ringY = -100
let animId
let clickTimer = null

const LERP = 0.14

function onMouseMove(e) {
  mouseX = e.clientX
  mouseY = e.clientY

  // 检测靠近照片
  const el = document.elementFromPoint(mouseX, mouseY)
  nearPhoto.value = !!el?.closest('.scatter-item, .grid-item, .strip-item, .memory-card')
}

function onMouseDown() {
  clicking.value = true
  if (clickTimer) clearTimeout(clickTimer)
  clickTimer = setTimeout(() => { clicking.value = false }, 250)
}

function animate() {
  animId = requestAnimationFrame(animate)

  ringX += (mouseX - ringX) * LERP
  ringY += (mouseY - ringY) * LERP

  if (ring.value) {
    ring.value.style.transform = `translate(${ringX}px, ${ringY}px)`
  }
}

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove, { passive: true })
  window.addEventListener('mousedown', onMouseDown)
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animId)
  if (clickTimer) clearTimeout(clickTimer)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mousedown', onMouseDown)
})
</script>

<style scoped>
.cursor-fx {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 10000;
}

/* 对焦环 */
.cursor-ring {
  position: absolute;
  width: 32px;
  height: 32px;
  border: 1.5px solid rgba(212, 160, 106, 0.25);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition:
    width 0.3s cubic-bezier(0.16, 1, 0.3, 1),
    height 0.3s cubic-bezier(0.16, 1, 0.3, 1),
    border-color 0.3s ease,
    border-width 0.15s ease,
    opacity 0.3s ease;
  /* 对焦环的四个缺口 */
  background:
    radial-gradient(circle, transparent 60%, rgba(212, 160, 106, 0.03) 100%);
}

/* 对焦环缺口线 — 模拟相机对焦指示 */
.cursor-ring::before,
.cursor-ring::after {
  content: '';
  position: absolute;
  background: rgba(212, 160, 106, 0.3);
  border-radius: 1px;
}

/* 上下短线 */
.cursor-ring::before {
  width: 1.5px;
  height: 5px;
  top: -3px;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0 36px 0 rgba(212, 160, 106, 0.3);
}

/* 左右短线 */
.cursor-ring::after {
  width: 5px;
  height: 1.5px;
  left: -3px;
  top: 50%;
  transform: translateY(-50%);
  box-shadow: 36px 0 0 rgba(212, 160, 106, 0.3);
}

/* 靠近照片 — 放大 + 亮度提升 */
.cursor-ring.ring-near {
  width: 40px;
  height: 40px;
  border-color: rgba(212, 160, 106, 0.35);
}

.cursor-ring.ring-near::before {
  background: rgba(212, 160, 106, 0.4);
  box-shadow: 0 44px 0 rgba(212, 160, 106, 0.4);
}
.cursor-ring.ring-near::after {
  background: rgba(212, 160, 106, 0.4);
  box-shadow: 44px 0 0 rgba(212, 160, 106, 0.4);
}

/* 点击 — 快门收缩 */
.cursor-ring.ring-click {
  width: 24px;
  height: 24px;
  border-width: 2px;
  border-color: rgba(212, 160, 106, 0.5);
  transition:
    width 0.08s ease-out,
    height 0.08s ease-out,
    border-width 0.08s ease-out,
    border-color 0.08s ease-out;
}
</style>
