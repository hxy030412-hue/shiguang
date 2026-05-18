<template>
  <Teleport to="body">
    <div class="modal-mask" @click.self="$emit('close')">
      <div class="modal-content">
        <button class="close-btn" @click="$emit('close')">×</button>
        <div class="photo-section">
          <img :src="photo.url" :alt="photo.title" />
        </div>
        <div class="info-section">
          <h2>{{ photo.title }}</h2>
          <div class="info-item">
            <span class="icon">📅</span>
            <span>{{ photo.date }}</span>
          </div>
          <div class="info-item">
            <span class="icon">📍</span>
            <span>{{ photo.location }}</span>
          </div>
          <div class="info-item">
            <span class="icon">👥</span>
            <span>{{ photo.people }}</span>
          </div>
          <div class="story">
            <p>{{ photo.story }}</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  photo: Object
})
defineEmits(['close'])
</script>

<style scoped>
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(4px);
}
.modal-content {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  max-width: 900px;
  width: 90%;
  max-height: 85vh;
  position: relative;
  animation: slideUp 0.3s ease;
}
@keyframes slideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.close-btn {
  position: absolute;
  top: 12px;
  right: 16px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 22px;
  cursor: pointer;
  z-index: 10;
  transition: background 0.3s;
}
.close-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}
.photo-section {
  flex: 1;
  min-width: 0;
}
.photo-section img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.info-section {
  flex: 0 0 320px;
  padding: 32px 24px;
  overflow-y: auto;
}
.info-section h2 {
  margin: 0 0 20px;
  font-size: 22px;
  color: #2c3e50;
}
.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  font-size: 15px;
  color: #555;
}
.icon {
  font-size: 18px;
}
.story {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}
.story p {
  font-size: 15px;
  line-height: 1.8;
  color: #444;
  margin: 0;
}
</style>
