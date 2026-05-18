<template>
  <div class="grid-container">
    <div
      v-for="photo in photos"
      :key="photo.id"
      class="grid-item"
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
defineProps({
  photos: Array
})
defineEmits(['select-photo'])
</script>

<style scoped>
.grid-container {
  columns: 4;
  column-gap: 16px;
  padding: 80px 32px 32px;
  max-width: 1400px;
  margin: 0 auto;
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
