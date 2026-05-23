<template>
  <div class="cursor-fx" ref="container">
    <div class="cursor-dot" ref="dot"></div>
    <div class="cursor-ring" ref="ring"></div>
    <div class="cursor-glow" ref="glow"></div>
    <canvas class="cursor-trail" ref="trailCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const container = ref(null)
const dot = ref(null)
const ring = ref(null)
const glow = ref(null)
const trailCanvas = ref(null)

let mouseX = 0, mouseY = 0
let ringX = 0, ringY = 0
let glowX = 0, glowY = 0
let trail = []
let animId
let ctx

const TRAIL_LENGTH = 20
const TRAIL_DECAY = 0.92

function init() {
  if (!trailCanvas.value) return
  ctx = trailCanvas.value.getContext('2d')
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
}

function resizeCanvas() {
  if (!trailCanvas.value) return
  trailCanvas.value.width = window.innerWidth
  trailCanvas.value.height = window.innerHeight
}

function onMouseMove(e) {
  mouseX = e.clientX
  mouseY = e.clientY

  // 添加到轨迹
  trail.push({ x: mouseX, y: mouseY, alpha: 1 })
  if (trail.length > TRAIL_LENGTH) trail.shift()
}

function animate() {
  animId = requestAnimationFrame(animate)

  // 平滑跟随
  ringX += (mouseX - ringX) * 0.15
  ringY += (mouseY - ringY) * 0.15
  glowX += (mouseX - glowX) * 0.08
  glowY += (mouseY - glowY) * 0.08

  // 更新位置
  if (dot.value) {
    dot.value.style.transform = `translate(${mouseX}px, ${mouseY}px)`
  }
  if (ring.value) {
    ring.value.style.transform = `translate(${ringX}px, ${ringY}px)`
  }
  if (glow.value) {
    glow.value.style.transform = `translate(${glowX}px, ${glowY}px)`
  }

  // 绘制轨迹
  if (ctx) {
    ctx.clearRect(0, 0, trailCanvas.value.width, trailCanvas.value.height)

    if (trail.length > 1) {
      ctx.beginPath()
      ctx.moveTo(trail[0].x, trail[0].y)

      for (let i = 1; i < trail.length; i++) {
        const p = trail[i]
        ctx.lineTo(p.x, p.y)
      }

      ctx.strokeStyle = 'rgba(212, 160, 106, 0.3)'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()

      // 轨迹光点
      for (let i = 0; i < trail.length; i++) {
        const p = trail[i]
        p.alpha *= TRAIL_DECAY

        ctx.beginPath()
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(212, 160, 106, ${p.alpha * 0.5})`
        ctx.fill()
      }
    }
  }
}

onMounted(() => {
  init()
  window.addEventListener('mousemove', onMouseMove)
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animId)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('resize', resizeCanvas)
})
</script>

<style scoped>
.cursor-fx {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 10000;
  mix-blend-mode: screen;
}

/* 中心点 */
.cursor-dot {
  position: absolute;
  width: 4px;
  height: 4px;
  background: #d4a06a;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 8px rgba(212, 160, 106, 0.8);
}

/* 跟随光环 */
.cursor-ring {
  position: absolute;
  width: 28px;
  height: 28px;
  border: 1.5px solid rgba(212, 160, 106, 0.4);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.2s, height 0.2s, border-color 0.2s;
}

/* 大光晕 */
.cursor-glow {
  position: absolute;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(212, 160, 106, 0.15) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  filter: blur(10px);
}

/* 轨迹画布 */
.cursor-trail {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* 悬停交互态 */
.cursor-fx.hover .cursor-ring {
  width: 40px;
  height: 40px;
  border-color: rgba(212, 160, 106, 0.6);
}

.cursor-fx.hover .cursor-dot {
  transform: translate(-50%, -50%) scale(1.5);
}
</style>
