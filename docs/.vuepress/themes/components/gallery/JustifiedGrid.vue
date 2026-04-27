<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import justifiedLayout from 'justified-layout'
import { VList } from 'virtua/vue'
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

interface RowItem { photo: Photo; width: number; height: number; left: number; eager: boolean }
interface Row { height: number; items: RowItem[] }

const rows = ref<Row[]>([])

function recompute() {
  if (!root.value) return
  const w = root.value.clientWidth || containerWidth.value
  if (!w) return
  containerWidth.value = w
  const sizes = props.photos.map(p => ({ width: p.w, height: p.h }))
  const layout = justifiedLayout(sizes, {
    containerWidth: w,
    targetRowHeight: props.targetRowHeight,
    boxSpacing: props.gap,
    containerPadding: 0,
  })
  // 按 top 分组成行
  const map = new Map<number, RowItem[]>()
  layout.boxes.forEach((b, i) => {
    const key = Math.round(b.top)
    const arr = map.get(key) ?? []
    arr.push({
      photo: props.photos[i],
      width: b.width,
      height: b.height,
      left: b.left,
      eager: i < props.eagerCount,
    })
    map.set(key, arr)
  })
  rows.value = [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, items]) => ({ height: Math.max(...items.map(it => it.height)), items }))
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
  <div ref="root" class="justified-grid">
    <VList
      :data="rows"
      :item-size="targetRowHeight + gap"
      class="justified-grid__viewport"
      #default="{ item: row }"
    >
      <div class="justified-grid__row" :style="{ height: row.height + 'px', marginBottom: gap + 'px', position: 'relative' }">
        <div
          v-for="it in row.items"
          :key="it.photo.id"
          class="justified-grid__cell"
          :style="{
            position: 'absolute',
            left: it.left + 'px',
            width: it.width + 'px',
            height: it.height + 'px',
          }"
          @click="emit('click', it.photo.id)"
        >
          <PhotoTile
            :photo="it.photo"
            :width="Math.round(it.width)"
            :height="Math.round(it.height)"
            :eager="it.eager"
          />
        </div>
      </div>
    </VList>
  </div>
</template>
