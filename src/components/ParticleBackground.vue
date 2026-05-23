<template>
  <div class="particle-bg" ref="container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'

const container = ref(null)
let renderer, scene, camera, clock, animId
let mouseX = 0, mouseY = 0
let groups = []

const PALETTE = [
  new THREE.Color(0x4a6fa5),  // 钢蓝
  new THREE.Color(0x6b8fc7),  // 浅蓝
  new THREE.Color(0x3d5a80),  // 深蓝
  new THREE.Color(0x98c1d9),  // 冰蓝
  new THREE.Color(0xd4a06a),  // 暖金
  new THREE.Color(0xc9b8a0),  // 米白
  new THREE.Color(0xe0d0b8),  // 浅金
  new THREE.Color(0xffffff),  // 纯白星光
]

function createLayer(count, radiusMin, radiusMax, sizeMin, sizeMax, opacity) {
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)
  const sizes = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    const r = radiusMin + Math.random() * (radiusMax - radiusMin)
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)

    pos[i3] = r * Math.sin(phi) * Math.cos(theta)
    pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    pos[i3 + 2] = r * Math.cos(phi)

    const c = PALETTE[Math.floor(Math.random() * PALETTE.length)]
    col[i3] = c.r
    col[i3 + 1] = c.g
    col[i3 + 2] = c.b

    sizes[i] = sizeMin + Math.random() * (sizeMax - sizeMin)
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  const vertexShader = `
    attribute float size;
    varying vec3 vColor;
    varying float vAlpha;
    uniform float uTime;
    uniform float uSpeed;

    void main() {
      vColor = color;
      vec3 pos = position;

      // 多层漂浮
      float drift1 = sin(uTime * uSpeed + position.x * 0.003) * 6.0;
      float drift2 = cos(uTime * uSpeed * 0.7 + position.z * 0.002) * 4.0;
      pos.y += drift1 + drift2 * 0.5;
      pos.x += cos(uTime * uSpeed * 0.5 + position.y * 0.004) * 3.0;

      // 呼吸闪烁 — 每颗星独立节奏
      float phase = position.x * 0.008 + position.y * 0.006 + position.z * 0.004;
      float pulse = 0.5 + 0.5 * sin(uTime * 0.4 + phase);
      vAlpha = pulse * 0.7 + 0.3;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = size * (280.0 / -mvPosition.z) * vAlpha;
      gl_Position = projectionMatrix * mvPosition;
    }
  `

  const fragmentShader = `
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      vec2 center = gl_PointCoord - 0.5;
      float dist = length(center);

      // 柔和高斯光晕
      float glow = exp(-dist * dist * 8.0);
      float core = exp(-dist * dist * 30.0);
      float alpha = (glow * 0.5 + core * 0.5) * vAlpha;

      // 中心加亮
      vec3 finalColor = vColor * (1.0 + core * 0.8);

      gl_FragColor = vec4(finalColor, alpha);
    }
  `

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSpeed: { value: 0.3 + Math.random() * 0.4 }
    },
    vertexShader,
    fragmentShader,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  })

  const points = new THREE.Points(geo, mat)
  return { points, mat }
}

function init() {
  const w = window.innerWidth
  const h = window.innerHeight

  scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x060a12, 0.0006)

  camera = new THREE.PerspectiveCamera(55, w / h, 1, 3000)
  camera.position.z = 600

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: false,
    powerPreference: 'high-performance'
  })
  renderer.setSize(w, h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.setClearColor(0x000000, 0)
  container.value.appendChild(renderer.domElement)

  // 远景层 — 大量微小粒子，缓慢漂移
  const far = createLayer(3000, 400, 1200, 0.5, 2.0, 0.6)
  scene.add(far.points)
  groups.push(far)

  // 中景层 — 中等密度
  const mid = createLayer(800, 200, 500, 1.5, 3.5, 0.8)
  scene.add(mid.points)
  groups.push(mid)

  // 近景层 — 稀疏大粒子，视觉焦点
  const near = createLayer(120, 80, 250, 3.0, 7.0, 1.0)
  scene.add(near.points)
  groups.push(near)

  // 极亮星光 — 少量闪烁亮点
  const stars = createLayer(30, 100, 600, 5.0, 12.0, 1.0)
  scene.add(stars.points)
  groups.push(stars)

  // 内层星云光晕
  const nebula = createLayer(200, 50, 180, 10.0, 25.0, 0.15)
  scene.add(nebula.points)
  groups.push(nebula)

  clock = new THREE.Clock()

  animate()
}

function animate() {
  animId = requestAnimationFrame(animate)
  const t = clock.getElapsedTime()

  groups.forEach(g => {
    g.mat.uniforms.uTime.value = t
  })

  // 鼠标视差 — 柔和跟焦
  const tx = mouseX * 30
  const ty = mouseY * 20
  camera.position.x += (tx - camera.position.x) * 0.008
  camera.position.y += (-ty - camera.position.y) * 0.008
  camera.lookAt(0, 0, 0)

  // 极缓慢自转
  groups.forEach((g, i) => {
    const speed = (i + 1) * 0.003
    g.points.rotation.y = t * speed * (i % 2 === 0 ? 1 : -1)
    g.points.rotation.x = Math.sin(t * 0.01) * 0.05
  })

  renderer.render(scene, camera)
}

function onMouseMove(e) {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2
}

function onResize() {
  if (!renderer || !camera) return
  const w = window.innerWidth
  const h = window.innerHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

onMounted(() => {
  init()
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  cancelAnimationFrame(animId)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('resize', onResize)
  renderer?.dispose()
  scene?.clear()
})
</script>

<style scoped>
.particle-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at 35% 25%, #0e1525 0%, #080c16 40%, #040609 70%, #020304 100%);
}
.particle-bg canvas {
  display: block;
}
</style>
