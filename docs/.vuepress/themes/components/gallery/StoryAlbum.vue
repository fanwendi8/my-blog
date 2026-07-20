<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useGalleryData } from '../../composables/useGalleryData'
import { largeSrc, thumbSrc } from '../../gallery/photoSources'
import { configureStoryAlbumPhotoSwipe, storyAlbumPhotoSwipeOptions } from '../../gallery/storyAlbumPhotoSwipe'
import { createStoryPhotoSwipeItems } from '../../gallery/storyPhotoSwipe'
import type { Photo } from '../../gallery/types'

const props = defineProps<{
  story: string
  captions?: Record<string, string | undefined>
}>()

const { photos } = useGalleryData()

const albumPhotos = computed(() => photos.value
  .filter((photo) => photo.storySlug === props.story)
  .sort((a, b) => (a.storyOrder ?? 0) - (b.storyOrder ?? 0)))

const albumIds = computed(() => albumPhotos.value.map(({ id }) => id))

function captionOf(photo: Photo) {
  return props.captions?.[photo.id] ?? photo.caption ?? undefined
}

function captionId(index: number) {
  return `story-album-caption-${index + 1}`
}

function accessibleLabel(photo: Photo, index: number) {
  return photo.alt?.trim() || photo.title?.trim() || `查看照片 ${index + 1}`
}

async function openPhotoSwipe(event: MouseEvent, index: number) {
  if (typeof window === 'undefined') return
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return

  event.preventDefault()

  const { default: PhotoSwipe } = await import('photoswipe')
  const pswp = new PhotoSwipe({
    ...storyAlbumPhotoSwipeOptions,
    dataSource: createStoryPhotoSwipeItems(photos.value, albumIds.value, props.captions),
    index,
    preloaderDelay: 0,
    showHideAnimationType: 'zoom',
    closeOnVerticalDrag: true,
  })

  configureStoryAlbumPhotoSwipe(pswp)
  pswp.init()
}
</script>

<template>
  <section class="story-album">
    <figure
      v-for="(photo, index) in albumPhotos"
      :key="`${photo.id}-${index}`"
      class="story-album__item"
    >
      <a
        class="story-album__frame"
        :href="largeSrc(photo)"
        :style="{ '--story-photo-ratio': `${photo.w} / ${photo.h}` }"
        :aria-label="accessibleLabel(photo, index)"
        :aria-describedby="captionOf(photo) ? captionId(index) : undefined"
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
      <figcaption v-if="captionOf(photo)" :id="captionId(index)" class="story-album__caption">
        {{ captionOf(photo) }}
      </figcaption>
    </figure>
    <RouterLink
      class="story-album__back"
      to="/gallery/"
      aria-label="返回瞳画"
      title="返回瞳画"
    >
      <svg aria-hidden="true" viewBox="0 0 20 20" focusable="false">
        <path d="M11.5 4.5 6 10l5.5 5.5" fill="none" stroke="currentColor" stroke-width="1" />
      </svg>
    </RouterLink>
  </section>
</template>
