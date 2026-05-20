<template>
  <div class="grid-container" :class="{ dark: darkMode }">
    <div
      v-for="photo in photos"
      :key="photo.id"
      class="grid-item"
      :class="{ 'is-hidden': selectedPhotoId === photo.id }"
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
  darkMode: Boolean,
  selectedPhotoId: Number
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
  column-gap: 16px;
  padding: 120px 24px 32px;
  min-height: 100vh;
  background: var(--bg);
  transition: background 0.5s;
}
.grid-item {
  break-inside: avoid;
  margin-bottom: 16px;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  position: relative;
  transition: transform 0.3s, box-shadow 0.3s;
  box-shadow: var(--shadow-card);
  border: 1px solid rgba(255,255,255,0.15);
  background: #fff;
}
.grid-item:hover {
  transform: scale(1.02);
  box-shadow: var(--shadow-card-hover);
}
.grid-item.is-hidden {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
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
