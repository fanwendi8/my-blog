<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import justifiedLayout from 'justified-layout'
import { Virtualizer } from 'virtua/vue'
import type { Photo } from './types'
import PhotoTile from './PhotoTile.vue'

const props = withDefaults(defineProps<{
  photos: Photo[]
  scrollRef?: HTMLElement | null
  targetRowHeight?: number
  gap?: number
  eagerCount?: number
}>(), { targetRowHeight: 260, gap: 14, eagerCount: 12 })

const emit = defineEmits<{ (e: 'click', id: string): void }>()

const root = ref<HTMLElement | null>(null)
const containerWidth = ref(0)
const startMargin = ref(0)

interface RowItem { photo: Photo; width: number; height: number; left: number; eager: boolean }
interface Row { height: number; items: RowItem[] }

const rows = ref<Row[]>([])

function updateStartMargin() {
  if (!root.value || !props.scrollRef) {
    startMargin.value = 0
    return
  }

  const rootRect = root.value.getBoundingClientRect()
  const scrollRect = props.scrollRef.getBoundingClientRect()
  startMargin.value = rootRect.top - scrollRect.top + props.scrollRef.scrollTop
}

function recompute() {
  if (!root.value) return
  let w = root.value.clientWidth || containerWidth.value
  if (!w && typeof window !== 'undefined') {
    w = Math.min(window.innerWidth - 64, 2880)
  }
  if (!w) return
  containerWidth.value = w
  const sizes = props.photos.map(p => ({ width: p.w, height: p.h }))
  const layout = justifiedLayout(sizes, {
    containerWidth: w,
    targetRowHeight: props.targetRowHeight,
    boxSpacing: props.gap,
    containerPadding: 0,
  })
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
  updateStartMargin()
}

let ro: ResizeObserver | null = null
let resizeListener: (() => void) | null = null

function scheduleRecompute() {
  window.requestAnimationFrame(() => {
    recompute()
    window.requestAnimationFrame(recompute)
  })
}

onMounted(() => {
  const setup = () => {
    recompute()
    if (typeof ResizeObserver !== 'undefined' && root.value) {
      ro = new ResizeObserver(() => recompute())
      ro.observe(root.value)
    }
    resizeListener = scheduleRecompute
    window.addEventListener('resize', resizeListener)
  }
  nextTick(() => window.requestAnimationFrame(() => window.setTimeout(setup, 50)))
})
onUnmounted(() => {
  ro?.disconnect()
  if (resizeListener) window.removeEventListener('resize', resizeListener)
})

watch(() => props.photos, recompute, { deep: false, immediate: true })
watch(() => props.scrollRef, () => nextTick(scheduleRecompute))

defineExpose({ recompute })
</script>

<template>
  <div ref="root" class="justified-grid">
    <Virtualizer
      class="justified-grid__viewport"
      :data="rows"
      :item-size="targetRowHeight + gap"
      :buffer-size="900"
      :scroll-ref="scrollRef ?? undefined"
      :start-margin="startMargin"
    >
      <template #default="{ item: row }">
        <div
          :key="row.items[0]?.photo.id"
          class="justified-grid__row"
          :style="{ height: row.height + 'px', marginBottom: gap + 'px', position: 'relative' }"
        >
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
      </template>
    </Virtualizer>
  </div>
</template>
