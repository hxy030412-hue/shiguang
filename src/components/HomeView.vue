<template>
  <div class="home">
    <div class="layout-switch">
      <button
        :class="{ active: layout === 'grid' }"
        @click="layout = 'grid'"
      >瀑布流</button>
      <button
        :class="{ active: layout === 'scatter' }"
        @click="layout = 'scatter'"
      >随机漂浮</button>
    </div>

    <GridLayout
      v-if="layout === 'grid'"
      :photos="photos"
      :darkMode="darkMode"
      @select-photo="onSelectGrid"
    />
    <ScatterLayout
      v-else
      :photos="photos"
      :darkMode="darkMode"
      @select-photo="onSelectScatter"
    />

    <PhotoModal
      v-if="selectedPhoto"
      :photo="selectedPhoto"
      :originRect="originRect"
      @close="selectedPhoto = null"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import GridLayout from './GridLayout.vue'
import ScatterLayout from './ScatterLayout.vue'
import PhotoModal from './PhotoModal.vue'

defineProps({
  photos: Array,
  darkMode: Boolean
})

const layout = ref('scatter')
const selectedPhoto = ref(null)
const originRect = ref(null)

function onSelectScatter({ photo, rect }) {
  originRect.value = rect
  selectedPhoto.value = photo
}

function onSelectGrid({ photo, rect }) {
  originRect.value = rect
  selectedPhoto.value = photo
}
</script>

<style scoped>
.layout-switch {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 90;
  display: flex;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
.layout-switch button {
  padding: 8px 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.3s;
}
.layout-switch button.active {
  background: #3498db;
  color: #fff;
}
</style>
