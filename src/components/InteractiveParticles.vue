<template>
  <div class="memory-atmosphere">
    <!-- 远层：模糊纹理 -->
    <div class="layer-far"></div>
    <!-- 中层：暖色光带 -->
    <div class="layer-mid"></div>
    <!-- 近层：漂浮尘埃 -->
    <canvas class="layer-near" ref="dustCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const dustCanvas = ref(null)
let animId
let particles = []

const DUST_COUNT = 18

function initDust() {
  const canvas = dustCanvas.value
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  particles = []
  for (let i = 0; i < DUST_COUNT; i++) {
    particles.push(createDust(canvas))
  }
}

function createDust(canvas) {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: 0.8 + Math.random() * 1.5,
    speedX: (Math.random() - 0.5) * 0.15,
    speedY: -0.05 - Math.random() * 0.1,
    alpha: 0.08 + Math.random() * 0.12,
    phase: Math.random() * Math.PI * 2,
    drift: 0.3 + Math.random() * 0.5
  }
}

function animateDust() {
  animId = requestAnimationFrame(animateDust)
  const canvas = dustCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height

  ctx.clearRect(0, 0, w, h)

  for (const p of particles) {
    p.phase += 0.008
    p.x += p.speedX + Math.sin(p.phase) * p.drift * 0.3
    p.y += p.speedY

    // 超出边界重置
    if (p.y < -10) {
      p.y = h + 10
      p.x = Math.random() * w
    }
    if (p.x < -10) p.x = w + 10
    if (p.x > w + 10) p.x = -10

    // 呼吸感透明度
    const breathAlpha = p.alpha * (0.7 + 0.3 * Math.sin(p.phase * 0.5))

    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(212, 180, 140, ${breathAlpha})`
    ctx.fill()
  }
}

function onResize() {
  const canvas = dustCanvas.value
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

onMounted(() => {
  initDust()
  animateDust()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  cancelAnimationFrame(animId)
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.memory-atmosphere {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: #0f0c0a;
}

/* 远层：模糊纹理 — 老纸张/地图质感 */
.layer-far {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 30%, rgba(45, 35, 25, 0.4) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 70%, rgba(40, 30, 20, 0.3) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(30, 24, 18, 0.5) 0%, #0f0c0a 70%);
  filter: blur(2px);
  opacity: 0.8;
}

/* 远层：极淡手写纹理（伪元素） */
.layer-far::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 40px,
      rgba(80, 60, 40, 0.02) 40px,
      rgba(80, 60, 40, 0.02) 41px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 60px,
      rgba(80, 60, 40, 0.015) 60px,
      rgba(80, 60, 40, 0.015) 61px
    );
  opacity: 0.5;
}

/* 远层：胶片齿孔纹理 */
.layer-far::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background-image:
    repeating-linear-gradient(
      180deg,
      transparent,
      transparent 28px,
      rgba(60, 45, 30, 0.03) 28px,
      rgba(60, 45, 30, 0.03) 30px
    );
  opacity: 0.6;
}

/* 中层：暖色光带 — 阳光透过窗帘的感觉 */
.layer-mid {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 30% 20%, rgba(180, 140, 80, 0.04) 0%, transparent 40%),
    radial-gradient(ellipse at 70% 80%, rgba(160, 120, 60, 0.03) 0%, transparent 35%),
    radial-gradient(ellipse at 50% 40%, rgba(200, 160, 100, 0.025) 0%, transparent 50%);
  animation: lightDrift 30s ease-in-out infinite alternate;
}

@keyframes lightDrift {
  0% { transform: translate(0, 0) scale(1); opacity: 0.6; }
  50% { transform: translate(-15px, 10px) scale(1.02); opacity: 0.8; }
  100% { transform: translate(10px, -5px) scale(0.98); opacity: 0.7; }
}

/* 近层：尘埃画布 */
.layer-near {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* 全局胶片噪点（复用 App.vue 的 SVG） */
.memory-atmosphere::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch' seed='2'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
  background-size: 200px 200px;
  opacity: 0.5;
  mix-blend-mode: soft-light;
}
</style>
