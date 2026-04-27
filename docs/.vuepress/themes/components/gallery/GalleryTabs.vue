<!-- docs/.vuepress/themes/components/gallery/GalleryTabs.vue -->
<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import type { GalleryTab } from './types'

const props = defineProps<{ modelValue: GalleryTab }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: GalleryTab): void }>()

const TABS: { id: GalleryTab; label: string }[] = [
  { id: 'timeline', label: '时间线' },
  { id: 'albums',   label: '专辑' },
  { id: 'tags',     label: '标签' },
]

const tabEls = ref<HTMLButtonElement[]>([])
const glowStyle = ref({ left: '0px', top: '0px', width: '0px', height: '0px' })

const activeIndex = computed(() => TABS.findIndex(t => t.id === props.modelValue))

const updateGlow = async () => {
  await nextTick()
  const el = tabEls.value[activeIndex.value]
  if (!el) return
  glowStyle.value = {
    left: `${el.offsetLeft}px`,
    top: `${el.offsetTop}px`,
    width: `${el.offsetWidth}px`,
    height: `${el.offsetHeight}px`,
  }
}

watch(activeIndex, updateGlow, { immediate: true })
onMounted(updateGlow)
</script>

<template>
  <nav class="gallery-tabs">
    <div class="gallery-tabs__glow" :style="glowStyle" />
    <button
      v-for="(t, i) in TABS"
      :key="t.id"
      :ref="(el) => { if (el) tabEls[i] = el as HTMLButtonElement }"
      class="gallery-tab"
      :class="{ 'is-active': modelValue === t.id }"
      @click="emit('update:modelValue', t.id)"
    >
      {{ t.label }}
    </button>
  </nav>
</template>
