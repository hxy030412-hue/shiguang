<template>
  <div class="particle-bg" ref="container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'

const container = ref(null)
let renderer, scene, camera, particles, clock
let mouseX = 0, mouseY = 0
let animId

const PARTICLE_COUNT = 2000
const COLORS = [
  new THREE.Color(0xd4a06a),  // 暖金
  new THREE.Color(0xc9854d),  // 琥珀
  new THREE.Color(0xf0d0a0),  // 浅金
  new THREE.Color(0xe8c090),  // 米金
  new THREE.Color(0xffffff),  // 纯白星光
]

function init() {
  const w = window.innerWidth
  const h = window.innerHeight

  // 场景
  scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x0a0806, 0.0008)

  // 相机
  camera = new THREE.PerspectiveCamera(60, w / h, 1, 2000)
  camera.position.z = 500

  // 渲染器
  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: false,
    powerPreference: 'high-performance'
  })
  renderer.setSize(w, h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)
  container.value.appendChild(renderer.domElement)

  // 粒子
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(PARTICLE_COUNT * 3)
  const colors = new Float32Array(PARTICLE_COUNT * 3)
  const sizes = new Float32Array(PARTICLE_COUNT)
  const speeds = new Float32Array(PARTICLE_COUNT)

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3
    // 球形分布
    const r = 300 + Math.random() * 700
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)

    positions[i3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i3 + 2] = r * Math.cos(phi)

    // 颜色
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    colors[i3] = color.r
    colors[i3 + 1] = color.g
    colors[i3 + 2] = color.b

    // 大小：大部分小，少数大（模拟星光）
    sizes[i] = Math.random() < 0.05 ? 3 + Math.random() * 4 : 1 + Math.random() * 2
    speeds[i] = 0.2 + Math.random() * 0.8
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  // 着色器材质
  const vertexShader = `
    attribute float size;
    varying vec3 vColor;
    varying float vAlpha;
    uniform float uTime;

    void main() {
      vColor = color;
      vec3 pos = position;

      // 缓慢漂浮
      float drift = sin(uTime * 0.1 + position.x * 0.005) * 8.0;
      pos.y += drift;
      pos.x += cos(uTime * 0.08 + position.z * 0.003) * 5.0;

      // 呼吸闪烁
      float pulse = 0.6 + 0.4 * sin(uTime * 0.5 + position.x * 0.01 + position.y * 0.01);
      vAlpha = pulse;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = size * (300.0 / -mvPosition.z) * pulse;
      gl_Position = projectionMatrix * mvPosition;
    }
  `

  const fragmentShader = `
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      // 圆形粒子 + 柔和光晕
      vec2 center = gl_PointCoord - 0.5;
      float dist = length(center);
      float alpha = smoothstep(0.5, 0.1, dist) * vAlpha * 0.8;

      // 中心更亮
      float core = smoothstep(0.3, 0.0, dist) * 0.5;

      gl_FragColor = vec4(vColor * (1.0 + core), alpha);
    }
  `

  const material = new THREE.ShaderMaterial({
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

  particles = new THREE.Points(geometry, material)
  scene.add(particles)

  // 内层星云 — 更密集的暖色光点
  const nebulaCount = 300
  const nebulaGeo = new THREE.BufferGeometry()
  const nebulaPos = new Float32Array(nebulaCount * 3)
  const nebulaColors = new Float32Array(nebulaCount * 3)
  const nebulaSizes = new Float32Array(nebulaCount)

  for (let i = 0; i < nebulaCount; i++) {
    const i3 = i * 3
    const r = 100 + Math.random() * 200
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)

    nebulaPos[i3] = r * Math.sin(phi) * Math.cos(theta)
    nebulaPos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    nebulaPos[i3 + 2] = r * Math.cos(phi)

    const c = new THREE.Color().lerpColors(
      new THREE.Color(0xd4a06a),
      new THREE.Color(0xf0d0a0),
      Math.random()
    )
    nebulaColors[i3] = c.r
    nebulaColors[i3 + 1] = c.g
    nebulaColors[i3 + 2] = c.b

    nebulaSizes[i] = 8 + Math.random() * 15
  }

  nebulaGeo.setAttribute('position', new THREE.BufferAttribute(nebulaPos, 3))
  nebulaGeo.setAttribute('color', new THREE.BufferAttribute(nebulaColors, 3))
  nebulaGeo.setAttribute('size', new THREE.BufferAttribute(nebulaSizes, 1))

  const nebulaMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader,
    fragmentShader,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  })

  const nebula = new THREE.Points(nebulaGeo, nebulaMat)
  scene.add(nebula)

  clock = new THREE.Clock()

  function animate() {
    animId = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()

    material.uniforms.uTime.value = t
    nebulaMat.uniforms.uTime.value = t

    // 鼠标视差
    const targetX = mouseX * 0.05
    const targetY = mouseY * 0.05
    camera.position.x += (targetX - camera.position.x) * 0.02
    camera.position.y += (-targetY - camera.position.y) * 0.02
    camera.lookAt(scene.position)

    // 缓慢整体旋转
    particles.rotation.y = t * 0.01
    nebula.rotation.y = -t * 0.015

    renderer.render(scene, camera)
  }

  animate()
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
  background: radial-gradient(ellipse at 40% 30%, #1a1410 0%, #0a0806 60%, #050403 100%);
}
.particle-bg canvas {
  display: block;
}
</style>
