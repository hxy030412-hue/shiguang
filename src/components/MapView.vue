<template>
  <div class="map-page" :class="{ dark: darkMode }">
    <div id="map" ref="mapEl"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  photos: Array,
  darkMode: Boolean
})

const mapEl = ref(null)
let map = null
let tileLayer = null

function initMap() {
  map = L.map(mapEl.value, {
    center: [30, 20],
    zoom: 2,
    minZoom: 2,
    zoomControl: false
  })

  L.control.zoom({ position: 'bottomright' }).addTo(map)

  const tileUrl = props.darkMode
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

  tileLayer = L.tileLayer(tileUrl, {
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  }).addTo(map)

  const coords = props.photos.map(p => [p.lat, p.lng])

  L.polyline(coords, {
    color: '#c9854d',
    weight: 2,
    opacity: 0.6,
    dashArray: '8, 8'
  }).addTo(map)

  props.photos.forEach(photo => {
    const icon = L.divIcon({
      className: 'photo-marker',
      html: `<div class="marker-img"><img src="${photo.url}" /></div>`,
      iconSize: [48, 48],
      iconAnchor: [24, 24]
    })

    const marker = L.marker([photo.lat, photo.lng], { icon }).addTo(map)
    marker.bindPopup(`
      <div class="popup-content">
        <img src="${photo.url}" />
        <h3>${photo.title}</h3>
        <p>${photo.date}</p>
        <p>${photo.location}</p>
      </div>
    `, { maxWidth: 260 })
  })
}

watch(() => props.darkMode, (dark) => {
  if (!map || !tileLayer) return
  const url = dark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
  tileLayer.setUrl(url)
})

onMounted(initMap)
</script>

<style scoped>
.map-page {
  padding-top: 64px;
  height: 100vh;
}
#map {
  width: 100%;
  height: calc(100vh - 64px);
}

:deep(.photo-marker) {
  background: none;
  border: none;
}
:deep(.marker-img) {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #fff;
  box-shadow: 0 2px 12px rgba(0,0,0,0.3);
  transition: transform 0.2s;
}
:deep(.marker-img:hover) {
  transform: scale(1.2);
}
:deep(.marker-img img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

:deep(.popup-content) {
  text-align: center;
}
:deep(.popup-content img) {
  width: 100%;
  height: 140px;
  object-fit: cover;
  border-radius: 6px;
  margin-bottom: 8px;
}
:deep(.popup-content h3) {
  margin: 0 0 4px;
  font-size: 15px;
  color: #2c2420;
}
:deep(.popup-content p) {
  margin: 0;
  font-size: 13px;
  color: #5a4e44;
}
</style>
