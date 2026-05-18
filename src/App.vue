<template>
  <div class="app">
    <LoginView v-if="!user" @login-success="onLogin" />

    <template v-else>
      <NavBar
        :darkMode="darkMode"
        :user="user"
        @toggle-dark="darkMode = !darkMode"
        @logout="logout"
        @add-photo="showAdd = true"
      />
      <router-view
        :photos="photos"
        :darkMode="darkMode"
        :user="user"
        :hasMore="hasMore"
        @refresh-photos="loadPhotos"
        @load-more="loadMore"
      />
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

const darkMode = ref(false)
const user = ref(null)
const photos = ref([])
const showAdd = ref(false)
const hasMore = ref(true)
let loadingMore = false

watch(darkMode, (val) => {
  document.body.classList.toggle('dark-mode', val)
})

async function loadPhotos() {
  try {
    const data = await api.getPhotos(0, 20)
    photos.value = data.photos
    hasMore.value = data.hasMore
  } catch {
    photos.value = []
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
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f0;
  min-height: 100vh;
  transition: background 0.5s;
}
body.dark-mode {
  background: #151210;
}
</style>
