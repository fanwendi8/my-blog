<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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

const pswpContainer = ref<HTMLElement | null>(null)
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
  if (!pswpContainer.value) return
  const idx = props.photos.findIndex(p => p.id === id)
  if (idx < 0) return
  const PhotoSwipe = await ensureLib()
  const dataSource = props.photos.map(p => ({ ...pickSrc(p), msrc: publicSrc(p.src.thumb), alt: p.title ?? '' }))
  const container = pswpContainer.value
  pswp = new PhotoSwipe({
    dataSource,
    index: idx,
    bgOpacity: 0.92,
    showHideAnimationType: 'fade',
    appendToEl: container,
    getViewportSizeFn: () => ({
      x: container.clientWidth,
      y: container.clientHeight,
    }),
  })
  pswp.on('afterInit', () => {
    const el = container!.querySelector('.pswp') as HTMLElement | null
    if (el) {
      el.style.position = 'absolute'
      el.style.inset = '0'
      el.style.width = '100%'
      el.style.height = '100%'
    }
  })
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
      await nextTick()
      await open(id)
    }
  } else if (!id && pswp) {
    close()
  }
})

onMounted(() => {
  if (props.activeId) {
    nextTick(() => open(props.activeId!))
  }
})
onBeforeUnmount(() => { pswp?.destroy?.() })
</script>

<template>
  <div v-if="activeId" class="gallery-lightbox">
    <div ref="pswpContainer" class="gallery-lightbox__stage"></div>
    <div class="gallery-lightbox__panel">
      <PhotoInfoPanel v-if="currentPhoto" :photo="currentPhoto" />
    </div>
  </div>
</template>
