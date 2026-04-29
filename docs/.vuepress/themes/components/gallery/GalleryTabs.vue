<!-- docs/.vuepress/themes/components/gallery/GalleryTabs.vue -->
<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import type { GalleryTab } from './types'

const props = defineProps<{ modelValue: GalleryTab }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: GalleryTab): void }>()

const TABS: { id: GalleryTab; label: string }[] = [
  { id: 'timeline', label: '时序' },
  { id: 'albums',   label: '辑册' },
]

const tabEls = ref<HTMLButtonElement[]>([])
const tabsRoot = ref<HTMLElement | null>(null)
const glowStyle = ref({
  transform: 'translate3d(0px, 0px, 0px)',
  width: '0px',
  height: '0px',
})

const activeIndex = computed(() => TABS.findIndex(t => t.id === props.modelValue))
let ro: ResizeObserver | null = null
let rafId: number | null = null

const updateGlow = async () => {
  await nextTick()
  const el = tabEls.value[activeIndex.value]
  if (!el) return
  glowStyle.value = {
    transform: `translate3d(${el.offsetLeft}px, ${el.offsetTop}px, 0px)`,
    width: `${el.offsetWidth}px`,
    height: `${el.offsetHeight}px`,
  }
}

function scheduleGlowUpdate() {
  if (rafId !== null) return
  rafId = requestAnimationFrame(() => {
    rafId = null
    updateGlow()
    requestAnimationFrame(updateGlow)
  })
}

function selectTab(tab: GalleryTab) {
  emit('update:modelValue', tab)
  scheduleGlowUpdate()
  window.setTimeout(updateGlow, 80)
}

watch(activeIndex, scheduleGlowUpdate, { immediate: true, flush: 'post' })

onMounted(() => {
  updateGlow()
  requestAnimationFrame(() => {
    updateGlow()
    requestAnimationFrame(updateGlow)
  })
  window.setTimeout(updateGlow, 120)
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(scheduleGlowUpdate)
    if (tabsRoot.value) ro.observe(tabsRoot.value)
    tabEls.value.forEach(el => ro?.observe(el))
  }
  window.addEventListener('resize', scheduleGlowUpdate)
  document.fonts?.ready.then(scheduleGlowUpdate)
})

onUnmounted(() => {
  ro?.disconnect()
  window.removeEventListener('resize', scheduleGlowUpdate)
  if (rafId !== null) cancelAnimationFrame(rafId)
})
</script>

<template>
  <nav ref="tabsRoot" class="gallery-tabs">
    <div class="gallery-tabs__glow" :style="glowStyle" />
    <button
      v-for="(t, i) in TABS"
      :key="t.id"
      :ref="(el) => { if (el) tabEls[i] = el as HTMLButtonElement }"
      class="gallery-tab"
      :class="{ 'is-active': modelValue === t.id }"
      @click="selectTab(t.id)"
    >
      {{ t.label }}
    </button>
  </nav>
</template>
