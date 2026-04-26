<!-- docs/.vuepress/themes/components/gallery/Lightbox.vue -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Photo } from './types'
import { publicSrc } from './cdn'
import PhotoInfoPanel from './PhotoInfoPanel.vue'

const props = defineProps<{
  photos: Photo[]
  activeId: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'navigate', id: string): void
}>()

const host = ref<HTMLElement | null>(null)
const currentPhoto = ref<Photo | null>(null)
let pswp: any = null

async function ensureLib() {
  // @ts-ignore - photoswipe v5 esm
  const mod = await import('photoswipe')
  return mod.default
}

function pickSrc(p: Photo) {
  return { src: publicSrc(p.src.large), w: p.w, h: p.h }
}

async function open(id: string) {
  if (typeof window === 'undefined') return
  const idx = props.photos.findIndex(p => p.id === id)
  if (idx < 0) return
  const PhotoSwipe = await ensureLib()
  const dataSource = props.photos.map(p => ({ ...pickSrc(p), msrc: publicSrc(p.src.thumb), alt: p.title ?? '' }))
  pswp = new PhotoSwipe({ dataSource, index: idx, bgOpacity: 0.92, showHideAnimationType: 'fade' })
  pswp.on('change', () => {
    const p = props.photos[pswp.currIndex]
    currentPhoto.value = p
    emit('navigate', p.id)
  })
  pswp.on('close', () => emit('close'))
  pswp.on('destroy', () => { pswp = null; currentPhoto.value = null })
  pswp.init()
  currentPhoto.value = props.photos[idx]
}

function close() { pswp?.close() }

watch(() => props.activeId, async (id, prev) => {
  if (id && id !== prev) {
    if (pswp) {
      const idx = props.photos.findIndex(p => p.id === id)
      if (idx >= 0 && idx !== pswp.currIndex) pswp.goTo(idx)
      else if (idx < 0) close()
    } else {
      await open(id)
    }
  } else if (!id && pswp) {
    close()
  }
}, { immediate: true })

onMounted(() => {})
onBeforeUnmount(() => { pswp?.destroy?.() })
</script>

<template>
  <div ref="host" class="gallery-lightbox-host">
    <Teleport to="body">
      <div v-if="currentPhoto" class="gallery-lightbox-info">
        <PhotoInfoPanel :photo="currentPhoto" />
      </div>
    </Teleport>
  </div>
</template>
