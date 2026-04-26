<script setup lang="ts">
import JustifiedGrid from './JustifiedGrid.vue'
import type { Photo } from './types'

defineProps<{ photos: Photo[] }>()
defineEmits<{ (e: 'open', id: string): void }>()
</script>

<template>
  <section class="gallery-tab gallery-tab--timeline">
    <div v-if="photos.length === 0" class="gallery-empty">还没有作品。</div>
    <JustifiedGrid v-else :photos="photos" @click="(id) => $emit('open', id)" />
  </section>
</template>
