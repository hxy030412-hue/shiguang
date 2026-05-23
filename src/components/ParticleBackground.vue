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

// 粒子扑面系统
const PARTICLE_COUNT = 3000
let positions, velocities, colors, sizes, phases

const PALETTE = [
  0x4a6fa5, 0x5a8bc0, 0x3d5a80,  // 蓝系
  0x98c1d9, 0x7ab0d0,            // 冰蓝
  0xd4a06a, 0xc9b8a0,            // 暖金
  0xe8dcc8, 0xffffff,            // 白星光
]

function init() {
  const w = window.innerWidth
  const h = window.innerHeight
  const dpr = Math.min(window.devicePixelRatio, 1.5)

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(75, w / h, 1, 2000)
  camera.position.z = 500

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

  // Bloom
  composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(w, h), 0.6, 0.4, 0.25))

  // 创建扑面粒子
  createRushParticles()

  clock = new THREE.Clock()
  animate()
}

function createRushParticles() {
  const geo = new THREE.BufferGeometry()
  positions = new Float32Array(PARTICLE_COUNT * 3)
  velocities = new Float32Array(PARTICLE_COUNT * 3)
  colors = new Float32Array(PARTICLE_COUNT * 3)
  sizes = new Float32Array(PARTICLE_COUNT)
  phases = new Float32Array(PARTICLE_COUNT)

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    resetParticle(i)
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))

  const vertexShader = `
    attribute float size;
    attribute float aPhase;
    varying vec3 vColor;
    varying float vAlpha;
    varying float vDist;
    uniform float uTime;

    void main() {
      vColor = color;
      vec4 mvPos = modelViewMatrix * vec4(position, 1.0);

      // 距离越近越亮越大
      float dist = -mvPos.z;
      vDist = dist;

      // 近处粒子更亮
      float brightness = smoothstep(1500.0, 100.0, dist);
      vAlpha = brightness * 0.8 + 0.2;

      // 呼吸闪烁
      float flicker = 0.8 + 0.2 * sin(uTime * 2.0 + aPhase * 6.28);
      vAlpha *= flicker;

      // 近处粒子更大
      float sizeScale = smoothstep(1500.0, 50.0, dist) * 3.0 + 1.0;

      gl_PointSize = size * sizeScale * (300.0 / dist) * flicker;
      gl_PointSize = max(gl_PointSize, 0.5);
      gl_PointSize = min(gl_PointSize, 30.0);
      gl_Position = projectionMatrix * mvPos;
    }
  `

  const fragmentShader = `
    varying vec3 vColor;
    varying float vAlpha;
    varying float vDist;

    void main() {
      vec2 c = gl_PointCoord - 0.5;
      float d = length(c);

      // 近处粒子有更强的光晕
      float glowStrength = smoothstep(1500.0, 100.0, vDist) * 0.5 + 0.3;
      float glow = exp(-d * d * 6.0) * glowStrength;
      float core = exp(-d * d * 40.0);
      float alpha = (glow + core) * vAlpha;

      // 近处中心更亮
      float coreBoost = smoothstep(1500.0, 100.0, vDist) * 1.5;
      vec3 finalCol = vColor * (1.0 + core * coreBoost);

      gl_FragColor = vec4(finalCol, alpha);
    }
  `

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }
    },
    vertexShader,
    fragmentShader,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  })

  const points = new THREE.Points(geo, mat)
  scene.add(points)
}

function resetParticle(i) {
  const i3 = i * 3

  // 在一个大锥形区域内随机分布
  const spread = 800
  positions[i3] = (Math.random() - 0.5) * spread
  positions[i3 + 1] = (Math.random() - 0.5) * spread
  positions[i3 + 2] = -200 - Math.random() * 1800  // 从远处开始

  // 向摄像机方向的速度（z正方向）
  const speed = 0.5 + Math.random() * 2.0
  velocities[i3] = (Math.random() - 0.5) * 0.3  // 轻微横向漂移
  velocities[i3 + 1] = (Math.random() - 0.5) * 0.3
  velocities[i3 + 2] = speed  // 向镜头飞来

  // 颜色
  const c = new THREE.Color(PALETTE[Math.floor(Math.random() * PALETTE.length)])
  colors[i3] = c.r
  colors[i3 + 1] = c.g
  colors[i3 + 2] = c.b

  // 大小：远处小，近处大
  sizes[i] = 1.0 + Math.random() * 3.0
  phases[i] = Math.random()
}

function animate() {
  animId = requestAnimationFrame(animate)
  const t = clock.getElapsedTime()
  const dt = Math.min(clock.getDelta(), 0.05)

  // 更新粒子位置
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3

    positions[i3] += velocities[i3]
    positions[i3 + 1] += velocities[i3 + 1]
    positions[i3 + 2] += velocities[i3 + 2]

    // 轻微的横向漂移
    positions[i3] += Math.sin(t * 0.5 + phases[i] * 10) * 0.05
    positions[i3 + 1] += Math.cos(t * 0.4 + phases[i] * 8) * 0.05

    // 当粒子飞过摄像机（z > 600）时重置到远处
    if (positions[i3 + 2] > 600) {
      resetParticle(i)
    }
  }

  // 标记需要更新
  const points = scene.children[0]
  if (points && points.geometry) {
    points.geometry.attributes.position.needsUpdate = true
  }

  // 更新 uniform
  if (points && points.material) {
    points.material.uniforms.uTime.value = t
  }

  // 鼠标视差
  targetMX += (mouseX - targetMX) * 0.02
  targetMY += (mouseY - targetMY) * 0.02
  camera.position.x = targetMX * 50
  camera.position.y = -targetMY * 30
  camera.lookAt(0, 0, -500)

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
  background: radial-gradient(ellipse at 50% 50%, #0e1628 0%, #080c16 40%, #040609 70%, #020304 100%);
}
.particle-bg canvas {
  display: block;
}
</style>
