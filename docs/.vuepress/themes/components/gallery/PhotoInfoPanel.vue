<!-- docs/.vuepress/themes/components/gallery/PhotoInfoPanel.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import type { Photo } from './types'

const props = defineProps<{ photo: Photo }>()

const taken = computed(() => {
  try { return new Date(props.photo.takenAt).toLocaleString('zh-CN', { hour12: false }) }
  catch { return props.photo.takenAt }
})

const gpsHref = computed(() => {
  if (!props.photo.gps) return null
  const { lat, lon } = props.photo.gps
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`
})
</script>

<template>
  <aside class="gallery-info">
    <header class="gallery-info__head">
      <h3 v-if="photo.title">{{ photo.title }}</h3>
      <time class="gallery-info__time">{{ taken }}</time>
    </header>

    <p v-if="photo.desc" class="gallery-info__desc">{{ photo.desc }}</p>

    <dl v-if="photo.exif" class="gallery-info__exif">
      <template v-if="photo.exif.camera"><dt>相机</dt><dd>{{ photo.exif.camera }}</dd></template>
      <template v-if="photo.exif.lens"><dt>镜头</dt><dd>{{ photo.exif.lens }}</dd></template>
      <template v-if="photo.exif.fl != null"><dt>焦距</dt><dd>{{ photo.exif.fl }}mm</dd></template>
      <template v-if="photo.exif.fn != null"><dt>光圈</dt><dd>f/{{ photo.exif.fn }}</dd></template>
      <template v-if="photo.exif.iso != null"><dt>ISO</dt><dd>ISO {{ photo.exif.iso }}</dd></template>
      <template v-if="photo.exif.exp"><dt>快门</dt><dd>{{ photo.exif.exp }}</dd></template>
    </dl>

    <div v-if="photo.tags?.length" class="gallery-info__tags">
      <span v-for="t in photo.tags" :key="t" class="gallery-info__tag">{{ t }}</span>
    </div>

    <a v-if="gpsHref" :href="gpsHref" class="gallery-info__gps" target="_blank" rel="noopener">
      在地图打开 ↗
    </a>
  </aside>
</template>
