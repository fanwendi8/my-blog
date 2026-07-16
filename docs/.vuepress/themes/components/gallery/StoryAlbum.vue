<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useGalleryData } from '../../composables/useGalleryData'
import { largeSrc, thumbSrc } from '../../gallery/photoSources'
import { galleryPhotoSwipeOptions } from '../../gallery/photoSwipeOptions'
import { createStoryPhotoSwipeItems } from '../../gallery/storyPhotoSwipe'
import type { Photo } from '../../gallery/types'

const props = defineProps<{
  ids: string[]
  captions?: Record<string, string | undefined>
}>()

const { photos } = useGalleryData()

const albumPhotos = computed(() => {
  const photosById = new Map(photos.value.map((photo) => [photo.id, photo]))

  return props.ids.flatMap((id) => {
    const photo = photosById.get(id)
    return photo ? [{ id, photo }] : []
  })
})

function captionOf(photo: Photo) {
  return props.captions?.[photo.id] ?? photo.caption ?? undefined
}

async function openPhotoSwipe(event: MouseEvent, index: number) {
  if (typeof window === 'undefined') return
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return

  event.preventDefault()

  const { default: PhotoSwipe } = await import('photoswipe')
  const pswp = new PhotoSwipe({
    ...galleryPhotoSwipeOptions,
    dataSource: createStoryPhotoSwipeItems(photos.value, props.ids, props.captions),
    index,
    preloaderDelay: 0,
    showHideAnimationType: 'zoom',
    closeOnVerticalDrag: true,
    wheelToZoom: false,
  })

  pswp.init()
}
</script>

<template>
  <section class="story-album">
    <figure
      v-for="({ id, photo }, index) in albumPhotos"
      :key="`${id}-${index}`"
      class="story-album__item"
    >
      <a
        class="story-album__frame"
        :href="largeSrc(photo)"
        @click="openPhotoSwipe($event, index)"
      >
        <img
          class="story-album__image"
          :src="thumbSrc(photo)"
          :alt="photo.alt ?? photo.title ?? ''"
          :width="photo.w"
          :height="photo.h"
          loading="lazy"
          decoding="async"
          no-view
        >
      </a>
      <figcaption v-if="captionOf(photo)" class="story-album__caption">
        {{ captionOf(photo) }}
      </figcaption>
    </figure>
    <RouterLink class="story-album__back" to="/gallery/">返回瞳画</RouterLink>
  </section>
</template>
