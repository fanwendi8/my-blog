<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
const drawerHeight = ref(28)
const isDrawerDragging = ref(false)
let pswp: any = null
let drawerStartY = 0
let drawerStartHeight = 28
let drawerMoved = false

const drawerStyle = computed(() => ({
  '--gallery-drawer-height': `${drawerHeight.value}px`,
}))
const isDrawerFullscreen = computed(() => drawerHeight.value > drawerMaxHeight() * 0.82)

function drawerMaxHeight() {
  if (typeof window === 'undefined') return 720
  return window.innerHeight
}

function clampDrawerHeight(height: number) {
  return Math.max(28, Math.min(drawerMaxHeight(), height))
}

function resetDrawer() {
  drawerHeight.value = 28
  isDrawerDragging.value = false
}

function setDrawerHeight(height: number) {
  drawerHeight.value = clampDrawerHeight(height)
}

function onDrawerPointerDown(event: PointerEvent) {
  if (typeof window === 'undefined') return
  isDrawerDragging.value = true
  drawerMoved = false
  drawerStartY = event.clientY
  drawerStartHeight = drawerHeight.value
  ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
}

function onDrawerPointerMove(event: PointerEvent) {
  if (!isDrawerDragging.value) return
  if (Math.abs(event.clientY - drawerStartY) > 4) drawerMoved = true
  setDrawerHeight(drawerStartHeight + drawerStartY - event.clientY)
}

function onDrawerPointerUp(event: PointerEvent) {
  if (!isDrawerDragging.value) return
  isDrawerDragging.value = false
  ;(event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId)
  if (drawerHeight.value < 96) setDrawerHeight(28)
}

function toggleDrawer() {
  if (drawerMoved) {
    drawerMoved = false
    return
  }
  const max = drawerMaxHeight()
  setDrawerHeight(drawerHeight.value <= 40 ? max * 0.52 : 28)
}

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

  // 销毁旧实例
  if (pswp) {
    pswp.destroy()
    pswp = null
  }

  // 清理容器中可能残留的 DOM（关闭动画未走完时旧元素还在）
  pswpContainer.value.querySelectorAll('.pswp').forEach(el => el.remove())

  const idx = props.photos.findIndex(p => p.id === id)
  if (idx < 0) return
  const PhotoSwipe = await ensureLib()
  const dataSource = props.photos.map(p => ({ ...pickSrc(p), msrc: publicSrc(p.src.thumb), alt: p.title ?? '' }))
  const container = pswpContainer.value

  // 先设置 currentPhoto 让 panel 渲染，确保 flex 布局稳定后再测量 viewport
  currentPhoto.value = props.photos[idx]
  await nextTick()

  pswp = new PhotoSwipe({
    dataSource,
    index: idx,
    bgOpacity: 0.35,
    showHideAnimationType: 'fade',
    appendToEl: container,
    initialZoomLevel: 'fit',
    secondaryZoomLevel: 'fill',
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
  // 必须用普通函数，this 指向触发事件的实例；
  // close() 提前把 pswp 变量设为 null 后，旧实例动画结束触发 destroy，
  // 此时 pswp 可能已指向新实例，this !== pswp 可避免误杀新实例。
  pswp.on('destroy', function () {
    if (this === pswp) {
      pswp = null
      currentPhoto.value = null
    }
  })
  pswp.init()
}

function close() {
  if (!pswp) return
  pswp.close()
  // 不等 destroy 事件，立即清理引用，让下次 watch 走 open() 重建路径
  pswp = null
  currentPhoto.value = null
  resetDrawer()
}

watch(() => props.activeId, async (id, prev) => {
  if (id && id !== prev) {
    if (pswp) {
      const idx = props.photos.findIndex(p => p.id === id)
      if (idx >= 0 && idx !== pswp.currIndex) pswp.goTo(idx)
      else if (idx < 0) close()
    } else {
      await nextTick()
      resetDrawer()
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
    <div ref="pswpContainer" class="gallery-lightbox__stage gallery-lightbox__stage-shell"></div>
    <div
      class="gallery-lightbox__panel"
      :class="{ 'is-dragging': isDrawerDragging, 'is-fullscreen': isDrawerFullscreen }"
      :style="drawerStyle"
    >
      <button
        type="button"
        class="gallery-lightbox__drawer-handle"
        aria-label="拖动照片信息"
        @click="toggleDrawer"
        @pointerdown="onDrawerPointerDown"
        @pointermove="onDrawerPointerMove"
        @pointerup="onDrawerPointerUp"
        @pointercancel="onDrawerPointerUp"
      ></button>
      <PhotoInfoPanel v-if="currentPhoto" :photo="currentPhoto" />
    </div>
  </div>
</template>
