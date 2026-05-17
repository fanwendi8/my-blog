<script setup lang="ts">
import { computed } from 'vue'
import { usePageFrontmatter } from 'vuepress/client'

interface StoryFrontmatter {
  title?: string
  date?: string
  location?: string
}

const frontmatter = usePageFrontmatter<StoryFrontmatter>()

const formattedDate = computed(() => {
  if (!frontmatter.value.date) return null
  try {
    return new Date(frontmatter.value.date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return frontmatter.value.date
  }
})
</script>

<template>
  <header class="photo-story-header">
    <h1>{{ frontmatter.title }}</h1>
    <p class="photo-story-header__meta">
      <time v-if="formattedDate">{{ formattedDate }}</time>
      <span v-if="frontmatter.location">{{ frontmatter.location }}</span>
    </p>
  </header>
</template>
