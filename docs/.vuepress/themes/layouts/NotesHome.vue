<script setup lang="ts">
import type { ThemeHomeConfigBase } from 'vuepress-theme-plume'
import { VPHomeBox } from 'vuepress-theme-plume/client'
import NoteCard from '../components/NoteCard.vue'

interface PinnedItem {
  title: string
  desc?: string
  link: string
  cover?: string
  tags?: string[]
}

const props = defineProps<ThemeHomeConfigBase & {
  index: number
  pinned?: PinnedItem[]
}>()
</script>

<template>
  <VPHomeBox
    :index="index"
    :type="type"
    :background-image="backgroundImage"
    :background-attachment="backgroundAttachment"
    :full="full"
  >
    <div class="notes-home-grid">
      <NoteCard
        v-for="item in pinned"
        :key="item.link"
        v-bind="item"
      />
    </div>
  </VPHomeBox>
</template>

<style scoped>
.notes-home-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}
</style>
