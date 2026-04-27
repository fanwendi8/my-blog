<script setup lang="ts">
import { computed } from 'vue'
import JustifiedGrid from './JustifiedGrid.vue'
import type { Photo } from './types'

const props = defineProps<{ photos: Photo[] }>()
defineEmits<{ (e: 'open', id: string): void }>()

const yearGroups = computed(() => {
  const groups = new Map<number, Photo[]>()
  for (const photo of props.photos) {
    const year = new Date(photo.takenAt).getFullYear()
    if (!groups.has(year)) groups.set(year, [])
    groups.get(year)!.push(photo)
  }
  return [...groups.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, photos]) => ({ year, photos }))
})
</script>

<template>
  <section class="gallery-tab gallery-tab--timeline">
    <div v-if="photos.length === 0" class="gallery-empty">还没有作品。</div>
    <div v-else class="timeline">
      <div
        v-for="group in yearGroups"
        :key="group.year"
        class="timeline__year-group"
      >
        <div class="timeline__marker">
          <span class="timeline__dot" />
          <span class="timeline__year">{{ group.year }}</span>
          <span class="timeline__count">{{ group.photos.length }} 件</span>
        </div>
        <div class="timeline__grid">
          <JustifiedGrid :photos="group.photos" @click="(id) => $emit('open', id)" />
        </div>
      </div>
    </div>
  </section>
</template>
