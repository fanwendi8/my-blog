<script setup lang="ts">
import { computed } from 'vue'
import { useGalleryData } from '../../composables/useGalleryData'
import type { Photo } from '../../gallery/types'
import { largeSrc } from '../../gallery/photoSources'

const props = withDefaults(defineProps<{
  id: string
  mode?: 'single' | 'tile'
  caption?: string
}>(), {
  mode: 'single',
  caption: undefined,
})

const { photos } = useGalleryData()

const photo = computed<Photo | null>(() => {
  return photos.value.find((item) => item.id === props.id) ?? null
})

const resolvedCaption = computed(() => props.caption ?? photo.value?.caption ?? null)

function srcOf(item: Photo) {
  return largeSrc(item, { viewportWidth: 1280, devicePixelRatio: 1 })
}

function placeholderStyle(item: Photo) {
  return {
    backgroundColor: item.bg ?? undefined,
    backgroundImage: item.placeholder ? `url(${item.placeholder})` : undefined,
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  }
}
</script>

<template>
  <figure
    v-if="photo"
    :class="[
      'photo-story-gallery__figure',
      `photo-story-gallery__figure--${mode}`,
    ]"
  >
    <img
      class="photo-story-gallery__image"
      :src="srcOf(photo)"
      :alt="photo.alt ?? photo.title ?? ''"
      loading="lazy"
      decoding="async"
      :width="photo.w"
      :height="photo.h"
      :style="placeholderStyle(photo)"
    >
    <figcaption v-if="mode === 'single' && resolvedCaption">{{ resolvedCaption }}</figcaption>
  </figure>
</template>
