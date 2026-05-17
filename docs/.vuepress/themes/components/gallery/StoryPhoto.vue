<script setup lang="ts">
import PhotoStoryImage from './PhotoStoryImage.vue'

defineProps<{
  id: string
  caption?: string
}>()
</script>

<template>
  <section class="photo-story-block photo-story-photo">
    <PhotoStoryImage :id="id" mode="single" :caption="caption" />
  </section>
</template>
