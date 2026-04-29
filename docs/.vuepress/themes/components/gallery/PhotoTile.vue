<!-- docs/.vuepress/themes/components/gallery/PhotoTile.vue -->
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { decode } from 'blurhash'
import type { Photo } from './types'
import { publicSrc } from './cdn'

const props = withDefaults(defineProps<{
  photo: Photo
  width: number
  height: number
  eager?: boolean
}>(), { eager: false })

const root = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const loaded = ref(false)
const errored = ref(false)
const src = computed(() => publicSrc(props.photo.src.thumb))
let observer: IntersectionObserver | null = null
let decoded = false

const displayDate = computed(() => {
  try {
    const date = new Date(props.photo.takenAt)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day}`
  } catch {
    return ''
  }
})

function onError() { errored.value = true }

function drawBlurhash() {
  if (decoded || !canvas.value || !props.photo.blurhash) return
  decoded = true
  try {
    const w = 32, h = Math.round(32 * (props.photo.h / props.photo.w))
    const px = decode(props.photo.blurhash, w, h)
    const ctx = canvas.value.getContext('2d')!
    canvas.value.width = w
    canvas.value.height = h
    const imageData = ctx.createImageData(w, h)
    imageData.data.set(px)
    ctx.putImageData(imageData, 0, 0)
  } catch { /* 解码失败退化为单色背景 */ }
}

onMounted(() => {
  if (!root.value || !canvas.value || !props.photo.blurhash) return
  if (typeof IntersectionObserver === 'undefined') {
    drawBlurhash()
    return
  }

  observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return
    observer?.disconnect()
    observer = null
    drawBlurhash()
  }, { rootMargin: '360px 0px' })

  observer.observe(root.value)
})

onUnmounted(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <div ref="root" class="photo-tile">
    <canvas ref="canvas" class="photo-tile__bh" :class="{ 'is-hidden': loaded || errored }" />
    <img
      v-if="!errored"
      :src="src"
      :width="width"
      :height="height"
      :loading="eager ? 'eager' : 'lazy'"
      :alt="photo.title ?? ''"
      decoding="async"
      @load="loaded = true"
      @error="onError"
    />
    <div v-if="!errored && (photo.title || displayDate || photo.tags?.[0])" class="photo-tile__meta">
      <div class="photo-tile__meta-main">
        <strong v-if="photo.title">{{ photo.title }}</strong>
        <span v-if="displayDate" class="photo-tile__date">{{ displayDate }}</span>
      </div>
      <span v-if="photo.tags?.[0]" class="photo-tile__tag">{{ photo.tags[0] }}</span>
    </div>
    <div v-if="errored" class="photo-tile__error" role="img" aria-label="加载失败">
      <span>!</span>
    </div>
  </div>
</template>
