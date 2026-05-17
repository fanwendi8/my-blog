<script setup lang="ts">
import { computed } from 'vue'
import PhotoStoryImage from './PhotoStoryImage.vue'

const props = withDefaults(defineProps<{
  left: string[]
  right: string[]
  reverse?: boolean
  vertical?: boolean
  caption?: string
}>(), {
  reverse: false,
  vertical: false,
  caption: undefined,
})

const primaryIds = computed(() => props.reverse ? props.right : props.left)
const secondaryIds = computed(() => props.reverse ? props.left : props.right)
</script>

<template>
  <section
    :class="[
      'photo-story-block',
      'photo-story-split',
      {
        'photo-story-split--reverse': reverse,
        'photo-story-split--vertical': vertical,
      },
    ]"
    :style="{ '--story-secondary-count': String(secondaryIds.length) }"
  >
    <div class="photo-story-split__primary">
      <PhotoStoryImage
        v-for="id in primaryIds"
        :key="id"
        :id="id"
        mode="tile"
      />
    </div>
    <div class="photo-story-split__secondary">
      <PhotoStoryImage
        v-for="id in secondaryIds"
        :key="id"
        :id="id"
        mode="tile"
      />
    </div>
    <div v-if="caption" class="photo-story-group-caption">{{ caption }}</div>
  </section>
</template>
