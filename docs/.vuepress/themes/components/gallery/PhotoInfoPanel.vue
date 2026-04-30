<!-- docs/.vuepress/themes/components/gallery/PhotoInfoPanel.vue -->
<script setup lang="ts">
import VPIcon from 'vuepress-theme-plume/components/VPIcon.vue'
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

const exifItems = computed(() => {
  const exif = props.photo.exif
  if (!exif) return []

  return [
    exif.camera ? { key: 'camera', icon: 'solar:camera-linear', label: '相机', value: exif.camera } : null,
    exif.lens ? { key: 'lens', icon: 'streamline-freehand:lens-horizontal', label: '镜头', value: exif.lens } : null,
    exif.fl != null ? { key: 'fl', icon: 'arcticons:hyperfocal-pro', label: '焦距', value: `${exif.fl}mm` } : null,
    exif.fn != null ? { key: 'fn', icon: 'et:aperture', label: '光圈', value: `f/${exif.fn}` } : null,
    exif.iso != null ? { key: 'iso', icon: 'carbon:iso-outline', label: 'ISO', value: `ISO ${exif.iso}` } : null,
    exif.exp ? { key: 'exp', icon: 'material-symbols-light:shutter-speed-outline', label: '快门', value: exif.exp } : null,
  ].filter(Boolean) as Array<{ key: string, icon: string, label: string, value: string }>
})
</script>

<template>
  <aside class="gallery-info">
    <header class="gallery-info__head">
      <h3 v-if="photo.title">{{ photo.title }}</h3>
      <time class="gallery-info__time">{{ taken }}</time>
    </header>

    <p v-if="photo.desc" class="gallery-info__desc">{{ photo.desc }}</p>

    <section v-if="exifItems.length" class="gallery-info__section">
      <dl class="gallery-info__exif">
        <div
          v-for="item in exifItems"
          :key="item.key"
          class="gallery-info__exif-item"
          :class="`gallery-info__exif-item--${item.key}`"
        >
          <VPIcon class="gallery-info__exif-icon" :name="item.icon" />
          <dt>{{ item.label }}</dt>
          <dd>{{ item.value }}</dd>
        </div>
      </dl>
    </section>

    <div v-if="photo.tags?.length" class="gallery-info__tags">
      <span v-for="t in photo.tags" :key="t" class="gallery-info__tag">{{ t }}</span>
    </div>

    <a v-if="gpsHref" :href="gpsHref" class="gallery-info__gps" target="_blank" rel="noopener">
      <span class="gallery-info__gps-label">
        <VPIcon class="gallery-info__gps-icon" name="solar:map-point-linear" />
        在地图打开
      </span>
      <VPIcon class="gallery-info__gps-arrow" name="solar:arrow-right-up-linear" />
    </a>
  </aside>
</template>
