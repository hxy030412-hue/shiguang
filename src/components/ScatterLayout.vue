<template>
  <div class="scatter-container">
    <div
      v-for="(photo, index) in positionedPhotos"
      :key="photo.id"
      class="scatter-item"
      :style="{
        left: photo.x + '%',
        top: photo.y + 'px',
        width: photo.w + 'px',
        transform: `rotate(${photo.rotate}deg)`,
        zIndex: photo.z
      }"
      @click="$emit('select-photo', photo)"
    >
      <img :src="photo.url" :alt="photo.title" />
      <div class="overlay">
        <span class="title">{{ photo.title }}</span>
        <span class="location">📍 {{ photo.location }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  photos: Array
})
defineEmits(['select-photo'])

const positionedPhotos = computed(() => {
  const seed = [12, 55, 28, 72, 5, 42, 85, 18, 62, 35, 78, 8]
  return props.photos.map((photo, i) => ({
    ...photo,
    x: seed[i % seed.length],
    y: 80 + Math.floor(i / 3) * 340 + (i % 2 === 0 ? 0 : 40),
    w: 220 + (i % 3) * 60,
    rotate: (i % 2 === 0 ? -1 : 1) * (5 + (i % 4) * 3),
    z: 10 - (i % 5)
  }))
})
</script>

<style scoped>
.scatter-container {
  position: relative;
  min-height: 1800px;
  padding: 20px;
  overflow-x: hidden;
}
.scatter-item {
  position: absolute;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.4s;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}
.scatter-item:hover {
  transform: rotate(0deg) scale(1.15) !important;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  z-index: 99 !important;
}
.scatter-item img {
  width: 100%;
  display: block;
  object-fit: cover;
  height: 200px;
}
.overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: #fff;
  opacity: 0;
  transition: opacity 0.3s;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.scatter-item:hover .overlay {
  opacity: 1;
}
.title {
  font-size: 14px;
  font-weight: 600;
}
.location {
  font-size: 12px;
  opacity: 0.85;
}
</style>
