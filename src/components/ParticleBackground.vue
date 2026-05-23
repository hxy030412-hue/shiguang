<template>
  <div class="particle-bg" ref="container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

const container = ref(null)
let renderer, scene, camera, composer, clock, animId
let mouseX = 0, mouseY = 0
let targetMX = 0, targetMY = 0
let layers = []

// 色板：深蓝宇宙 + 暖金星光
const PALETTE = [
  0x4a6fa5, 0x5a8bc0, 0x3d5a80,  // 蓝系
  0x98c1d9, 0x7ab0d0,            // 冰蓝
  0xd4a06a, 0xc9b8a0,            // 暖金
  0xe8dcc8, 0xffffff,            // 白星光
]

function makeLayer(count, rMin, rMax, sMin, sMax, speedMul) {
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const phases = new Float32Array(count) // 每颗星独立相位

  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    const r = rMin + Math.random() * (rMax - rMin)
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)

    pos[i3]     = r * Math.sin(phi) * Math.cos(theta)
    pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    pos[i3 + 2] = r * Math.cos(phi)

    const c = new THREE.Color(PALETTE[Math.floor(Math.random() * PALETTE.length)])
    col[i3]     = c.r
    col[i3 + 1] = c.g
    col[i3 + 2] = c.b

    sizes[i] = sMin + Math.random() * (sMax - sMin)
    phases[i] = Math.random() * Math.PI * 2
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))

  const vertexShader = `
    attribute float size;
    attribute float aPhase;
    varying vec3 vColor;
    varying float vAlpha;
    uniform float uTime;
    uniform float uSpeed;

    void main() {
      vColor = color;
      vec3 pos = position;

      // 三层叠加漂浮
      pos.y += sin(uTime * uSpeed + aPhase) * 5.0;
      pos.y += sin(uTime * uSpeed * 0.37 + position.x * 0.002) * 3.0;
      pos.x += cos(uTime * uSpeed * 0.6 + aPhase * 1.3) * 3.5;
      pos.z += sin(uTime * uSpeed * 0.4 + aPhase * 0.7) * 2.5;

      // 呼吸闪烁
      float flicker = 0.55 + 0.45 * sin(uTime * 0.35 + aPhase * 3.0);
      vAlpha = flicker;

      vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = size * (260.0 / -mvPos.z) * flicker;
      gl_PointSize = max(gl_PointSize, 0.5);
      gl_Position = projectionMatrix * mvPos;
    }
  `

  const fragmentShader = `
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      vec2 c = gl_PointCoord - 0.5;
      float d = length(c);

      // 高斯光晕 + 明亮核心
      float glow = exp(-d * d * 6.0);
      float core = exp(-d * d * 40.0);
      float alpha = (glow * 0.4 + core * 0.6) * vAlpha;

      vec3 finalCol = vColor * (1.0 + core * 1.2);
      gl_FragColor = vec4(finalCol, alpha);
    }
  `

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSpeed: { value: speedMul }
    },
    vertexShader,
    fragmentShader,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  })

  const mesh = new THREE.Points(geo, mat)
  return { mesh, mat }
}

function init() {
  const w = window.innerWidth
  const h = window.innerHeight
  const dpr = Math.min(window.devicePixelRatio, 1.5)

  // 场景
  scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x050810, 0.0005)

  // 相机
  camera = new THREE.PerspectiveCamera(50, w / h, 1, 4000)
  camera.position.z = 700

  // 渲染器
  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: false,
    powerPreference: 'high-performance'
  })
  renderer.setSize(w, h)
  renderer.setPixelRatio(dpr)
  renderer.setClearColor(0x000000, 0)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  container.value.appendChild(renderer.domElement)

  // Bloom 后处理
  composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))

  const bloom = new UnrealBloomPass(
    new THREE.Vector2(w, h),
    0.8,   // 强度
    0.4,   // 半径
    0.3    // 阈值
  )
  composer.addPass(bloom)

  // 粒子层
  // 远景：海量微尘
  const far = makeLayer(4000, 500, 1500, 0.3, 1.8, 0.15)
  scene.add(far.mesh)
  layers.push(far)

  // 中远景
  const midFar = makeLayer(1200, 300, 700, 1.0, 3.0, 0.22)
  scene.add(midFar.mesh)
  layers.push(midFar)

  // 中景
  const mid = makeLayer(500, 150, 400, 2.0, 4.5, 0.3)
  scene.add(mid.mesh)
  layers.push(mid)

  // 近景：大粒子
  const near = makeLayer(80, 60, 200, 4.0, 8.0, 0.4)
  scene.add(near.mesh)
  layers.push(near)

  // 极亮星光
  const bright = makeLayer(25, 100, 500, 8.0, 16.0, 0.5)
  scene.add(bright.mesh)
  layers.push(bright)

  // 星云光晕
  const nebula = makeLayer(150, 40, 160, 15.0, 35.0, 0.12)
  scene.add(nebula.mesh)
  layers.push(nebula)

  clock = new THREE.Clock()
  animate()
}

function animate() {
  animId = requestAnimationFrame(animate)
  const t = clock.getElapsedTime()

  // 更新所有层
  layers.forEach(l => { l.mat.uniforms.uTime.value = t })

  // 平滑鼠标跟随
  targetMX += (mouseX - targetMX) * 0.012
  targetMY += (mouseY - targetMY) * 0.012

  camera.position.x = targetMX * 40
  camera.position.y = -targetMY * 25
  camera.lookAt(0, 0, 0)

  // 差速自转
  layers.forEach((l, i) => {
    const dir = i % 2 === 0 ? 1 : -1
    const speed = (0.002 + i * 0.001) * dir
    l.mesh.rotation.y = t * speed
    l.mesh.rotation.x = Math.sin(t * 0.008 + i) * 0.03
  })

  composer.render()
}

function onMouseMove(e) {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2
}

function onResize() {
  if (!renderer || !camera || !composer) return
  const w = window.innerWidth
  const h = window.innerHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
  composer.setSize(w, h)
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
  composer?.dispose()
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
  background: radial-gradient(ellipse at 30% 20%, #0e1628 0%, #090e1a 35%, #050810 65%, #020306 100%);
}
.particle-bg canvas {
  display: block;
}
</style>
