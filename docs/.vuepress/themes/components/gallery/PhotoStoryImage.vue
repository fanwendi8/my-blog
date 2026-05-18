<script setup lang="ts">
import { computed } from 'vue'
import { useGalleryData } from '../../composables/useGalleryData'
import type { Photo } from '../../gallery/types'
import { largeSrc } from '../../gallery/photoSources'
import { galleryPhotoSwipeOptions } from '../../gallery/photoSwipeOptions'

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
const resolvedSrc = computed(() => photo.value ? srcOf(photo.value) : '')

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

async function openPhotoSwipe(event: MouseEvent) {
  if (!photo.value || typeof window === 'undefined') return
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return

  event.preventDefault()

  const { default: PhotoSwipe } = await import('photoswipe')
  const item = photo.value
  const pswp = new PhotoSwipe({
    ...galleryPhotoSwipeOptions,
    dataSource: [{
      type: 'image',
      src: resolvedSrc.value,
      width: item.w,
      height: item.h,
      alt: item.alt ?? item.title ?? '',
      msrc: resolvedSrc.value,
    }],
    index: 0,
    preloaderDelay: 0,
    showHideAnimationType: 'zoom',
    closeOnVerticalDrag: true,
    wheelToZoom: false,
  })

  pswp.init()
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
    <a
      class="photo-story-gallery__link"
      :href="resolvedSrc"
      :data-pswp-width="photo.w"
      :data-pswp-height="photo.h"
      @click="openPhotoSwipe"
    >
      <img
        class="photo-story-gallery__image"
        :src="resolvedSrc"
        :alt="photo.alt ?? photo.title ?? ''"
        loading="lazy"
        decoding="async"
        no-view
        :width="photo.w"
        :height="photo.h"
        :style="placeholderStyle(photo)"
      >
    </a>
    <figcaption v-if="mode === 'single' && resolvedCaption">{{ resolvedCaption }}</figcaption>
  </figure>
</template>
