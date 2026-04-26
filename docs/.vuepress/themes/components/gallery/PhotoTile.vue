<!-- docs/.vuepress/themes/components/gallery/PhotoTile.vue -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { decode } from 'blurhash'
import type { Photo } from './types'
import { publicSrc } from './cdn'

const props = withDefaults(defineProps<{
  photo: Photo
  width: number
  height: number
  eager?: boolean
}>(), { eager: false })

const canvas = ref<HTMLCanvasElement | null>(null)
const loaded = ref(false)
const src = computed(() => publicSrc(props.photo.src.thumb))

onMounted(() => {
  if (!canvas.value || !props.photo.blurhash) return
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
})
</script>

<template>
  <div class="photo-tile" :style="{ width: width + 'px', height: height + 'px' }">
    <canvas ref="canvas" class="photo-tile__bh" :class="{ 'is-hidden': loaded }" />
    <img
      :src="src"
      :width="width"
      :height="height"
      :loading="eager ? 'eager' : 'lazy'"
      :alt="photo.title ?? ''"
      decoding="async"
      @load="loaded = true"
    />
  </div>
</template>
