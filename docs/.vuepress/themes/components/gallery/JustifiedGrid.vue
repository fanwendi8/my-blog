<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import justifiedLayout from 'justified-layout'
import type { Photo } from './types'
import PhotoTile from './PhotoTile.vue'

const props = withDefaults(defineProps<{
  photos: Photo[]
  targetRowHeight?: number
  gap?: number
  eagerCount?: number
}>(), { targetRowHeight: 240, gap: 6, eagerCount: 12 })

const emit = defineEmits<{ (e: 'click', id: string): void }>()

const root = ref<HTMLElement | null>(null)
const containerWidth = ref(0)
const layout = ref<{ totalHeight: number; boxes: Array<{ width: number; height: number; top: number; left: number }> }>({ totalHeight: 0, boxes: [] })

function recompute() {
  if (!root.value) return
  const w = root.value.clientWidth || containerWidth.value
  if (!w) return
  containerWidth.value = w
  const sizes = props.photos.map(p => ({ width: p.w, height: p.h }))
  layout.value = justifiedLayout(sizes, {
    containerWidth: w,
    targetRowHeight: props.targetRowHeight,
    boxSpacing: props.gap,
    containerPadding: 0,
  })
}

let ro: ResizeObserver | null = null
onMounted(() => {
  recompute()
  if (typeof ResizeObserver !== 'undefined' && root.value) {
    ro = new ResizeObserver(() => recompute())
    ro.observe(root.value)
  }
})
onUnmounted(() => ro?.disconnect())

watch(() => props.photos, recompute, { deep: false })

defineExpose({ recompute })
</script>

<template>
  <div ref="root" class="justified-grid" :style="{ height: layout.totalHeight + 'px' }">
    <div v-for="(p, i) in photos" :key="p.id" class="justified-grid__cell"
      :style="{ position: 'absolute', left: layout.boxes[i]?.left + 'px', top: layout.boxes[i]?.top + 'px', width: layout.boxes[i]?.width + 'px', height: layout.boxes[i]?.height + 'px' }"
      @click="emit('click', p.id)">
      <PhotoTile :photo="p" :width="Math.round(layout.boxes[i]?.width ?? 0)" :height="Math.round(layout.boxes[i]?.height ?? 0)" :eager="i < eagerCount" />
    </div>
  </div>
</template>
