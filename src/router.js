import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './components/HomeView.vue'
import MapView from './components/MapView.vue'
import SettingsView from './components/SettingsView.vue'
import TimeBoxView from './components/TimeBoxView.vue'

const routes = [
  { path: '/', component: HomeView },
  { path: '/map', component: MapView },
  { path: '/timebox', component: TimeBoxView },
  { path: '/settings', component: SettingsView }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
