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
const errored = ref(false)
const src = computed(() => publicSrc(props.photo.src.thumb))

function onError() { errored.value = true }

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
    <div v-if="!errored && (photo.title || photo.tags?.length)" class="photo-tile__meta">
      <span v-if="photo.tags?.[0]" class="photo-tile__tag">{{ photo.tags[0] }}</span>
      <strong v-if="photo.title">{{ photo.title }}</strong>
    </div>
    <div v-if="errored" class="photo-tile__error" role="img" aria-label="加载失败">
      <span>!</span>
    </div>
  </div>
</template>
