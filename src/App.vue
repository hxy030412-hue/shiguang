<template>
  <div class="app">
    <!-- 全局胶片颗粒 -->
    <svg class="film-grain" xmlns="http://www.w3.org/2000/svg">
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" seed="5"/>
        <feColorMatrix type="saturate" values="0"/>
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" opacity="0.02"/>
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
  --bg: #faf6f0;
  --bg-gradient: radial-gradient(ellipse at 40% 25%, #fdf9f3 0%, #f5efe5 40%, #ede5d8 80%, #e4dbd0 100%);
  --surface: rgba(255, 253, 248, 0.78);
  --surface-solid: #fffcf6;
  --accent: #c27a3e;
  --accent-hover: #a86830;
  --accent-glow: rgba(194, 122, 62, 0.14);
  --text: #2a2018;
  --text-secondary: #5c4e40;
  --text-muted: #908070;
  --border: rgba(140, 110, 70, 0.1);
  --border-strong: rgba(140, 110, 70, 0.18);
  --input-bg: rgba(255, 250, 242, 0.7);
  --input-border: rgba(160, 130, 90, 0.12);
  --shadow-sm: 0 2px 10px rgba(60, 44, 28, 0.06);
  --shadow-md: 0 8px 36px rgba(60, 44, 28, 0.1);
  --shadow-lg: 0 20px 56px rgba(60, 44, 28, 0.14);
  --shadow-card: 0 4px 24px rgba(60, 44, 28, 0.08), 0 1px 4px rgba(60, 44, 28, 0.04);
  --shadow-card-hover: 0 14px 44px rgba(60, 44, 28, 0.16), 0 2px 8px rgba(60, 44, 28, 0.06);
  --glass-border: rgba(255, 255, 255, 0.3);
  --error: #c44;
  --success: #5a8;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;

  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  --font-serif: 'Noto Serif SC', 'Source Han Serif CN', 'Songti SC', Georgia, 'Times New Roman', serif;
  --font-display: var(--font-sans);

  --text-xs: 11px;
  --text-sm: 13px;
  --text-base: 15px;
  --text-lg: 17px;
  --text-xl: 20px;
  --text-2xl: 26px;
  --text-3xl: 34px;
  --text-4xl: 44px;

  --leading-tight: 1.25;
  --leading-normal: 1.6;
  --leading-relaxed: 1.85;

  --tracking-tight: -0.02em;
  --tracking-normal: 0.01em;
  --tracking-wide: 0.06em;
  --tracking-wider: 0.12em;
}

body.dark-mode {
  --bg: #181310;
  --bg-gradient: radial-gradient(ellipse at 40% 25%, #28221c 0%, #1e1814 40%, #161210 80%, #110e0c 100%);
  --surface: rgba(32, 26, 22, 0.78);
  --surface-solid: #1e1814;
  --accent: #d4a06a;
  --accent-hover: #c08848;
  --accent-glow: rgba(212, 160, 106, 0.1);
  --text: #ece0d2;
  --text-secondary: #c0ad98;
  --text-muted: #8a7c6c;
  --border: rgba(255, 220, 160, 0.06);
  --border-strong: rgba(255, 220, 160, 0.12);
  --input-bg: rgba(38, 32, 26, 0.85);
  --input-border: rgba(255, 220, 160, 0.08);
  --shadow-sm: 0 2px 10px rgba(0, 0, 0, 0.25);
  --shadow-md: 0 8px 36px rgba(0, 0, 0, 0.35);
  --shadow-lg: 0 20px 56px rgba(0, 0, 0, 0.45);
  --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(212, 160, 106, 0.04);
  --shadow-card-hover: 0 14px 44px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(212, 160, 106, 0.08);
  --glass-border: rgba(255, 220, 160, 0.06);
  --error: #e66;
  --success: #6b8;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  font-family: var(--font-sans);
  background: var(--bg-gradient);
  color: var(--text);
  min-height: 100vh;
  transition: background 0.6s, color 0.5s;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: var(--text-base);
  letter-spacing: var(--tracking-normal);
  line-height: var(--leading-normal);
}

/* Typography hierarchy */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: var(--tracking-tight);
  line-height: var(--leading-tight);
  color: var(--text);
}
h1 { font-size: var(--text-3xl); font-weight: 500; letter-spacing: var(--tracking-wide); }
h2 { font-size: var(--text-2xl); }
h3 { font-size: var(--text-xl); }
h4 { font-size: var(--text-lg); }

p {
  line-height: var(--leading-relaxed);
  letter-spacing: var(--tracking-normal);
}

small, .text-sm {
  font-size: var(--text-sm);
  letter-spacing: var(--tracking-normal);
}

.text-muted {
  color: var(--text-muted);
  font-size: var(--text-sm);
  letter-spacing: var(--tracking-wide);
}

/* 胶片颗粒 */
.film-grain {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.5;
  mix-blend-mode: soft-light;
}

/* 滚动条 */
::-webkit-scrollbar {
  width: 5px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(160, 130, 90, 0.2);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(160, 130, 90, 0.35);
}

/* 选中文本 */
::selection {
  background: rgba(194, 122, 62, 0.18);
  color: var(--accent);
}

/* 全局链接 */
a {
  color: var(--accent);
  text-decoration: none;
  transition: color 0.3s;
}
a:hover {
  color: var(--accent-hover);
}

/* Page transitions */
.page-enter-active {
  transition: opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
