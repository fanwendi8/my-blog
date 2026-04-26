<!-- docs/.vuepress/themes/components/gallery/GalleryTabs.vue -->
<script setup lang="ts">
import type { GalleryTab } from './types'

const props = defineProps<{ modelValue: GalleryTab }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: GalleryTab): void }>()

const TABS: { id: GalleryTab; label: string }[] = [
  { id: 'timeline', label: '时间线' },
  { id: 'albums',   label: '专辑' },
  { id: 'tags',     label: '标签' },
]
</script>

<template>
  <nav class="gallery-tabs">
    <button
      v-for="t in TABS"
      :key="t.id"
      class="gallery-tab"
      :class="{ 'is-active': modelValue === t.id }"
      @click="emit('update:modelValue', t.id)"
    >
      {{ t.label }}
    </button>
  </nav>
</template>
