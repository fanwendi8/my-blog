<!-- docs/.vuepress/themes/components/gallery/AlbumDetail.vue -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Album, Photo } from './types'
import JustifiedGrid from './JustifiedGrid.vue'
import { filterPhotos } from '../../composables/useFiltering'

const props = defineProps<{
  album: Album
  photos: Photo[]
}>()
const emit = defineEmits<{
  (e: 'back'): void
  (e: 'open', id: string): void
}>()

const filtered = computed(() => filterPhotos(props.photos, { album: props.album.id }))
const gridScroll = ref<HTMLElement | null>(null)

function scrollToTop() {
  if (gridScroll.value) {
    gridScroll.value.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    gridScroll.value.scrollTop = 0
  }
}

defineExpose({ scrollToTop })
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
    <div ref="gridScroll" class="gallery-grid-scroll">
      <JustifiedGrid :photos="filtered" :scroll-ref="gridScroll" @click="(id) => emit('open', id)" />
    </div>
  </section>
</template>
