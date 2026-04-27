<!-- docs/.vuepress/themes/components/gallery/TabAlbums.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import type { Album, Photo } from './types'
import { publicSrc } from './cdn'

const props = defineProps<{ albums: Album[]; photos: Photo[] }>()
const emit = defineEmits<{ (e: 'open', albumId: string): void }>()

const photoById = computed(() => new Map(props.photos.map(p => [p.id, p])))

function coverSrc(a: Album): string {
  if (!a.cover) return ''
  const p = photoById.value.get(a.cover)
  return p ? publicSrc(p.src.thumb) : ''
}
</script>

<template>
  <section class="gallery-tab gallery-tab--albums">
    <div v-if="albums.length === 0" class="gallery-empty">还没有专辑。在 albums.config.mjs 中定义。</div>
    <div v-else class="gallery-album-grid">
      <button
        v-for="a in albums"
        :key="a.id"
        class="gallery-album-card"
        @click="emit('open', a.id)"
      >
        <div class="gallery-album-card__cover">
          <img v-if="coverSrc(a)" :src="coverSrc(a)" :alt="a.title" loading="lazy" decoding="async" />
          <div class="gallery-album-card__shade"></div>
          <div class="gallery-album-card__meta">
            <h3>{{ a.title }}</h3>
            <p>{{ a.desc || `${a.count} 张` }}</p>
            <span>{{ a.count }} 张</span>
          </div>
          <span class="gallery-album-card__arrow" aria-hidden="true">→</span>
        </div>
      </button>
    </div>
  </section>
</template>
