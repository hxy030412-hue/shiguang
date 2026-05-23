<template>
  <div class="interactive-particles" ref="container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

const props = defineProps({
  scrollY: { type: Number, default: 0 },
  clickPos: { type: Object, default: null },
  hoverElement: { type: String, default: '' }
})

const emit = defineEmits(['particle-click'])

const container = ref(null)
let renderer, scene, camera, composer, clock, animId
let mouseX = 0, mouseY = 0
let targetMX = 0, targetMY = 0

// 粒子系统
const PARTICLE_COUNT = 2500
let positions, velocities, colors, sizes, phases, lifetimes
let bursts = [] // 点击爆发效果

const PALETTE = [
  0x4a6fa5, 0x5a8bc0, 0x3d5a80,
  0x98c1d9, 0x7ab0d0,
  0xd4a06a, 0xc9b8a0,
  0xe8dcc8, 0xffffff,
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

  composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(w, h), 0.6, 0.4, 0.25))

  createBaseParticles()

  clock = new THREE.Clock()
  animate()
}

function createBaseParticles() {
  const geo = new THREE.BufferGeometry()
  positions = new Float32Array(PARTICLE_COUNT * 3)
  velocities = new Float32Array(PARTICLE_COUNT * 3)
  colors = new Float32Array(PARTICLE_COUNT * 3)
  sizes = new Float32Array(PARTICLE_COUNT)
  phases = new Float32Array(PARTICLE_COUNT)
  lifetimes = new Float32Array(PARTICLE_COUNT)

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    resetBaseParticle(i)
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
  geo.setAttribute('aLife', new THREE.BufferAttribute(lifetimes, 1))

  const vertexShader = `
    attribute float size;
    attribute float aPhase;
    attribute float aLife;
    varying vec3 vColor;
    varying float vAlpha;
    varying float vDist;
    uniform float uTime;
    uniform float uScroll;
    uniform vec2 uMouse;

    void main() {
      vColor = color;
      vec3 pos = position;

      // 滚动视差 — 不同层不同速度
      float layerDepth = mod(aPhase * 5.0, 1.0);
      pos.y += uScroll * layerDepth * 0.3;

      // 鼠标吸引/排斥
      vec2 mouseWorld = uMouse * 300.0;
      float mouseDist = length(pos.xy - mouseWorld);
      float mouseInfluence = smoothstep(200.0, 0.0, mouseDist) * 30.0;
      vec2 dir = normalize(pos.xy - mouseWorld + 0.001);
      pos.xy += dir * mouseInfluence;

      // 轻微漂浮
      pos.x += sin(uTime * 0.3 + aPhase * 6.28) * 2.0;
      pos.y += cos(uTime * 0.25 + aPhase * 4.0) * 2.0;

      vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
      float dist = -mvPos.z;
      vDist = dist;

      // 生命周期衰减
      float life = aLife;
      vAlpha = life * (smoothstep(1500.0, 100.0, dist) * 0.7 + 0.3);

      // 闪烁
      float flicker = 0.8 + 0.2 * sin(uTime * 1.5 + aPhase * 6.28);
      vAlpha *= flicker;

      float sizeScale = smoothstep(1500.0, 50.0, dist) * 2.5 + 1.0;
      gl_PointSize = size * sizeScale * (280.0 / dist) * flicker;
      gl_PointSize = max(gl_PointSize, 0.5);
      gl_PointSize = min(gl_PointSize, 25.0);
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

      float glowStrength = smoothstep(1500.0, 100.0, vDist) * 0.4 + 0.3;
      float glow = exp(-d * d * 6.0) * glowStrength;
      float core = exp(-d * d * 35.0);
      float alpha = (glow + core) * vAlpha;

      float coreBoost = smoothstep(1500.0, 100.0, vDist) * 1.2;
      vec3 finalCol = vColor * (1.0 + core * coreBoost);

      gl_FragColor = vec4(finalCol, alpha);
    }
  `

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) }
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

function resetBaseParticle(i) {
  const i3 = i * 3
  const spread = 900
  positions[i3] = (Math.random() - 0.5) * spread
  positions[i3 + 1] = (Math.random() - 0.5) * spread
  positions[i3 + 2] = -100 - Math.random() * 1400

  const speed = 0.3 + Math.random() * 1.5
  velocities[i3] = (Math.random() - 0.5) * 0.2
  velocities[i3 + 1] = (Math.random() - 0.5) * 0.2
  velocities[i3 + 2] = speed

  const c = new THREE.Color(PALETTE[Math.floor(Math.random() * PALETTE.length)])
  colors[i3] = c.r
  colors[i3 + 1] = c.g
  colors[i3 + 2] = c.b

  sizes[i] = 1.0 + Math.random() * 2.5
  phases[i] = Math.random()
  lifetimes[i] = 1.0
}

// 点击爆发效果
function createBurst(x, y) {
  const count = 40
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)
  const vel = []
  const life = new Float32Array(count)

  // 屏幕坐标转世界坐标
  const worldX = (x / window.innerWidth - 0.5) * 600
  const worldY = -(y / window.innerHeight - 0.5) * 400

  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    pos[i3] = worldX
    pos[i3 + 1] = worldY
    pos[i3 + 2] = 0

    // 各方向飞散
    const angle = Math.random() * Math.PI * 2
    const speed = 2 + Math.random() * 6
    vel.push({
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
      z: (Math.random() - 0.5) * 3
    })

    const c = new THREE.Color(PALETTE[Math.floor(Math.random() * PALETTE.length)])
    col[i3] = c.r
    col[i3 + 1] = c.g
    col[i3 + 2] = c.b

    life[i] = 1.0
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))

  const mat = new THREE.PointsMaterial({
    size: 4,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  })

  const points = new THREE.Points(geo, mat)
  scene.add(points)

  bursts.push({ points, vel, life, mat, pos })
}

function animate() {
  animId = requestAnimationFrame(animate)
  const t = clock.getElapsedTime()

  // 更新基础粒子
  const basePoints = scene.children[0]
  if (basePoints && basePoints.material.uniforms) {
    basePoints.material.uniforms.uTime.value = t
    basePoints.material.uniforms.uScroll.value = props.scrollY * 0.01
    basePoints.material.uniforms.uMouse.value.set(targetMX, targetMY)
  }

  // 移动基础粒子
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3
    positions[i3] += velocities[i3]
    positions[i3 + 1] += velocities[i3 + 1]
    positions[i3 + 2] += velocities[i3 + 2]

    if (positions[i3 + 2] > 600) {
      resetBaseParticle(i)
    }
  }

  if (basePoints && basePoints.geometry) {
    basePoints.geometry.attributes.position.needsUpdate = true
  }

  // 更新爆发粒子
  for (let b = bursts.length - 1; b >= 0; b--) {
    const burst = bursts[b]
    let allDead = true

    for (let i = 0; i < burst.life.length; i++) {
      burst.life[i] -= 0.015
      if (burst.life[i] > 0) {
        allDead = false
        const i3 = i * 3
        burst.pos[i3] += burst.vel[i].x
        burst.pos[i3 + 1] += burst.vel[i].y
        burst.pos[i3 + 2] += burst.vel[i].z

        // 重力
        burst.vel[i].y -= 0.05
        // 减速
        burst.vel[i].x *= 0.98
        burst.vel[i].y *= 0.98
      }
    }

    burst.mat.opacity = burst.life.reduce((a, b) => Math.max(a, b), 0)
    burst.points.geometry.attributes.position.needsUpdate = true

    if (allDead) {
      scene.remove(burst.points)
      burst.points.geometry.dispose()
      burst.mat.dispose()
      bursts.splice(b, 1)
    }
  }

  // 鼠标平滑
  targetMX += (mouseX - targetMX) * 0.015
  targetMY += (mouseY - targetMY) * 0.015
  camera.position.x = targetMX * 40
  camera.position.y = -targetMY * 25
  camera.lookAt(0, 0, -300)

  composer.render()
}

function onMouseMove(e) {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2
}

function onClick(e) {
  createBurst(e.clientX, e.clientY)
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
  window.addEventListener('click', onClick)
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  cancelAnimationFrame(animId)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('click', onClick)
  window.removeEventListener('resize', onResize)
  composer?.dispose()
  renderer?.dispose()
  scene?.clear()
})
</script>

<style scoped>
.interactive-particles {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at 50% 50%, #0e1628 0%, #080c16 40%, #040609 70%, #020304 100%);
}
.interactive-particles canvas {
  display: block;
}
</style>
