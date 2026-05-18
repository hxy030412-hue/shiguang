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
        @refresh-photos="loadPhotos"
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

watch(darkMode, (val) => {
  document.body.classList.toggle('dark-mode', val)
})

async function loadPhotos() {
  try {
    photos.value = await api.getPhotos()
  } catch {
    photos.value = []
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
