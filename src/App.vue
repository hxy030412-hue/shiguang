<template>
  <div class="app">
    <!-- 全局胶片颗粒 -->
    <svg class="film-grain" xmlns="http://www.w3.org/2000/svg">
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" seed="5"/>
        <feColorMatrix type="saturate" values="0"/>
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" opacity="0.025"/>
    </svg>

    <LoginView v-if="!user" @login-success="onLogin" />

    <template v-else>
      <NavBar
        :darkMode="darkMode"
        :user="user"
        @toggle-dark="toggleDark"
        @logout="logout"
        @add-photo="showAdd = true"
      />
      <router-view v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component
            :is="Component"
            :photos="photos"
            :darkMode="darkMode"
            :user="user"
            :hasMore="hasMore"
            :loadingPhotos="loadingPhotos"
            @refresh-photos="loadPhotos"
            @load-more="loadMore"
          />
        </Transition>
      </router-view>
      <AddPhotoModal
        v-if="showAdd"
        @close="showAdd = false"
        @saved="loadPhotos"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import NavBar from './components/NavBar.vue'
import LoginView from './components/LoginView.vue'
import AddPhotoModal from './components/AddPhotoModal.vue'
import { api } from './api'

const darkMode = ref(localStorage.getItem('darkMode') === 'true')
const user = ref(null)
const photos = ref([])
const showAdd = ref(false)
const hasMore = ref(true)
const loadingPhotos = ref(true)
let loadingMore = false

watch(darkMode, (val) => {
  document.body.classList.toggle('dark-mode', val)
  localStorage.setItem('darkMode', val)
})

function toggleDark() {
  darkMode.value = !darkMode.value
}

async function loadPhotos() {
  loadingPhotos.value = true
  try {
    const data = await api.getPhotos(0, 20)
    photos.value = data.photos
    hasMore.value = data.hasMore
  } catch {
    photos.value = []
  } finally {
    loadingPhotos.value = false
  }
}

async function loadMore() {
  if (loadingMore || !hasMore.value) return
  loadingMore = true
  try {
    const data = await api.getPhotos(photos.value.length, 20)
    photos.value = [...photos.value, ...data.photos]
    hasMore.value = data.hasMore
  } catch {} finally {
    loadingMore = false
  }
}

async function onLogin(u) {
  user.value = u
  await loadPhotos()
}

function logout() {
  localStorage.removeItem('token')
  user.value = null
  photos.value = []
}

onMounted(async () => {
  if (darkMode.value) document.body.classList.add('dark-mode')
  const token = localStorage.getItem('token')
  if (!token) return
  try {
    const u = await api.getProfile()
    user.value = u
    await loadPhotos()
  } catch {
    localStorage.removeItem('token')
  }
})
</script>

<style>
:root {
  --bg: #f8f5f0;
  --bg-gradient: radial-gradient(ellipse at 50% 30%, #faf8f3 0%, #f0ece4 50%, #e8e3da 100%);
  --surface: rgba(255, 255, 255, 0.72);
  --surface-solid: #fff;
  --accent: #c9854d;
  --accent-hover: #b87339;
  --accent-glow: rgba(201, 133, 77, 0.15);
  --text: #2c2420;
  --text-secondary: #5a4e44;
  --text-muted: #8a7e74;
  --border: rgba(0, 0, 0, 0.08);
  --border-strong: rgba(0, 0, 0, 0.15);
  --input-bg: rgba(255, 255, 255, 0.6);
  --input-border: rgba(0, 0, 0, 0.1);
  --shadow-sm: 0 2px 8px rgba(44, 36, 32, 0.06);
  --shadow-md: 0 8px 32px rgba(44, 36, 32, 0.1);
  --shadow-lg: 0 16px 48px rgba(44, 36, 32, 0.15);
  --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(0, 0, 0, 0.06);
  --shadow-card-hover: 0 12px 40px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.08);
  --glass-border: rgba(255, 255, 255, 0.25);
  --error: #d44;
  --success: #4a8;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
}

body.dark-mode {
  --bg: #1a1614;
  --bg-gradient: radial-gradient(ellipse at 50% 30%, #2a2520 0%, #1e1a16 50%, #151210 100%);
  --surface: rgba(30, 26, 22, 0.75);
  --surface-solid: #1e1a16;
  --accent: #d4a06a;
  --accent-hover: #c99050;
  --accent-glow: rgba(212, 160, 106, 0.12);
  --text: #e8ddd0;
  --text-secondary: #bfb0a0;
  --text-muted: #8a7e74;
  --border: rgba(255, 255, 255, 0.06);
  --border-strong: rgba(255, 255, 255, 0.12);
  --input-bg: rgba(42, 37, 32, 0.8);
  --input-border: rgba(255, 255, 255, 0.08);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 8px 32px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 16px 48px rgba(0, 0, 0, 0.4);
  --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 200, 120, 0.04);
  --shadow-card-hover: 0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 200, 120, 0.08);
  --glass-border: rgba(255, 255, 255, 0.08);
  --error: #e66;
  --success: #6b8;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans SC', sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  transition: background 0.5s, color 0.5s;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  letter-spacing: 0.01em;
  line-height: 1.6;
}

/* 胶片颗粒 */
.film-grain {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.6;
  mix-blend-mode: overlay;
}

/* 滚动条 */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

/* 选中文本 */
::selection {
  background: var(--accent-glow);
  color: var(--accent);
}

/* 全局链接 */
a {
  color: var(--accent);
  text-decoration: none;
}

/* Page transitions */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
