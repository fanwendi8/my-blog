<script setup lang="ts">
import PhotoStoryImage from './PhotoStoryImage.vue'

defineProps<{
  ids: string[]
  caption?: string
}>()
</script>

<template>
  <section
    class="photo-story-block photo-story-photos"
    :style="{ '--story-photo-count': String(ids.length) }"
  >
    <PhotoStoryImage
      v-for="id in ids"
      :key="id"
      :id="id"
      mode="tile"
    />
    <div v-if="caption" class="photo-story-group-caption">{{ caption }}</div>
  </section>
</template>
