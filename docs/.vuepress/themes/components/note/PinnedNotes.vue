<script setup lang="ts">
import { computed } from 'vue'
import { usePageFrontmatter } from 'vuepress/client'
import NoteCard from './NoteCard.vue'

interface NoteItem {
  title: string
  desc?: string
  link: string
  cover?: string
  tags?: string[]
}

const frontmatter = usePageFrontmatter<{ pinned?: NoteItem[] }>()
const notes = computed(() => frontmatter.value.pinned ?? [])
</script>

<template>
  <div class="pinned-notes">
    <NoteCard
      v-for="item in notes"
      :key="item.link"
      v-bind="item"
    />
  </div>
</template>

<style scoped>
.pinned-notes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin: 24px 0;
}
</style>
