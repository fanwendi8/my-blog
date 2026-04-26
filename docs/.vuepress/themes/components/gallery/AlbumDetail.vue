<!-- docs/.vuepress/themes/components/gallery/AlbumDetail.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import type { Album, Photo } from './types'
import JustifiedGrid from './JustifiedGrid.vue'
import { filterPhotos } from '../../composables/useFiltering'

const props = defineProps<{ album: Album; photos: Photo[] }>()
const emit = defineEmits<{
  (e: 'back'): void
  (e: 'open', id: string): void
}>()

const filtered = computed(() => filterPhotos(props.photos, { album: props.album.id }))
</script>

<template>
  <section class="gallery-album-detail">
    <header class="gallery-album-detail__head">
      <button class="gallery-back" @click="emit('back')">← 返回</button>
      <div>
        <h2>{{ album.title }}</h2>
        <p v-if="album.desc">{{ album.desc }}</p>
      </div>
    </header>
    <JustifiedGrid :photos="filtered" @click="(id) => emit('open', id)" />
  </section>
</template>
