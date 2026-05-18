<template>
  <div class="grid-container" :class="{ dark: darkMode }">
    <div
      v-for="photo in photos"
      :key="photo.id"
      class="grid-item"
      @click="onPhotoClick($event, photo)"
    >
      <img :src="photo.url" :alt="photo.title" loading="lazy" />
      <div class="overlay">
        <span class="title">{{ photo.title }}</span>
        <span class="location">📍 {{ photo.location }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  photos: Array,
  darkMode: Boolean
})
const emit = defineEmits(['select-photo'])

function onPhotoClick(e, photo) {
  const rect = e.currentTarget.getBoundingClientRect()
  emit('select-photo', { photo, rect })
}
</script>

<style scoped>
.grid-container {
  columns: 5;
  column-gap: 14px;
  padding: 80px 24px 32px;
  min-height: 100vh;
  transition: background 0.5s;
}
.grid-container.dark {
  background: #151210;
}
.grid-item {
  break-inside: avoid;
  margin-bottom: 16px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  transition: transform 0.3s, box-shadow 0.3s;
}
.grid-item:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}
.grid-container.dark .grid-item {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}
.grid-container.dark .grid-item:hover {
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6);
}
.grid-item img {
  width: 100%;
  display: block;
  object-fit: cover;
}
.overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: #fff;
  opacity: 0;
  transition: opacity 0.3s;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.grid-item:hover .overlay {
  opacity: 1;
}
.title {
  font-size: 16px;
  font-weight: 600;
}
.location {
  font-size: 13px;
  opacity: 0.85;
}
</style>
