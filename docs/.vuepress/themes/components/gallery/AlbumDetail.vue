<!-- docs/.vuepress/themes/components/gallery/AlbumDetail.vue -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Album, Photo } from './types'
import JustifiedGrid from './JustifiedGrid.vue'
import { filterPhotos } from '../../composables/useFiltering'

const props = defineProps<{
  album: Album
  photos: Photo[]
  activeTag?: string | null
}>()
const emit = defineEmits<{
  (e: 'back'): void
  (e: 'open', id: string): void
  (e: 'update:activeTag', tag: string | null): void
}>()

const internalTag = ref<string | null>(props.activeTag ?? null)
const currentTag = computed({
  get: () => props.activeTag ?? internalTag.value,
  set: (v) => { internalTag.value = v; emit('update:activeTag', v) },
})

const albumPhotos = computed(() => filterPhotos(props.photos, { album: props.album.id }))

const albumTags = computed(() => {
  const counts = new Map<string, number>()
  for (const p of albumPhotos.value) {
    for (const t of p.tags) {
      counts.set(t, (counts.get(t) ?? 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))
})

const filtered = computed(() => currentTag.value
  ? filterPhotos(albumPhotos.value, { tag: currentTag.value })
  : albumPhotos.value)

const gridScroll = ref<HTMLElement | null>(null)

function toggleTag(name: string) {
  currentTag.value = currentTag.value === name ? null : name
}

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
    <div v-if="albumTags.length" class="gallery-chips gallery-chips--album">
      <button
        class="gallery-chip"
        :class="{ 'is-active': !currentTag }"
        @click="currentTag = null"
      >
        全部 <span class="gallery-chip__count">{{ albumPhotos.length }}</span>
      </button>
      <button
        v-for="t in albumTags"
        :key="t.name"
        class="gallery-chip"
        :class="{ 'is-active': currentTag === t.name }"
        @click="toggleTag(t.name)"
      >
        {{ t.name }} <span class="gallery-chip__count">{{ t.count }}</span>
      </button>
    </div>
    <div ref="gridScroll" class="gallery-grid-scroll">
      <JustifiedGrid :photos="filtered" :scroll-ref="gridScroll" @click="(id) => emit('open', id)" />
    </div>
  </section>
</template>
