<script setup lang="ts">
import { computed, ref, nextTick, onMounted, onUnmounted } from 'vue'
import JustifiedGrid from './JustifiedGrid.vue'
import YearTimeline from './YearTimeline.vue'
import type { Photo } from './types'

const props = defineProps<{ photos: Photo[] }>()
defineEmits<{ (e: 'open', id: string): void }>()

const yearGroups = computed(() => {
  const groups = new Map<number, Photo[]>()
  for (const photo of props.photos) {
    const year = new Date(photo.takenAt).getFullYear()
    if (!groups.has(year)) groups.set(year, [])
    groups.get(year)!.push(photo)
  }
  return [...groups.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, photos]) => ({ year, photos }))
})

const yearList = computed(() =>
  yearGroups.value.map((g) => ({ year: g.year, count: g.photos.length }))
)

const activeYear = ref<number | null>(yearList.value[0]?.year ?? null)

const groupRefs = new Map<number, HTMLElement>()

function setGroupRef(el: HTMLElement, year: number) {
  groupRefs.set(year, el)
}

function scrollToYear(year: number) {
  const el = groupRefs.get(year)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

let observer: IntersectionObserver | null = null

onMounted(async () => {
  await nextTick()

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const year = Number((entry.target as HTMLElement).dataset.year)
          activeYear.value = year
        }
      }
    },
    { rootMargin: '-20% 0px -60% 0px' }
  )

  for (const el of groupRefs.values()) {
    observer.observe(el)
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>

<template>
  <section class="gallery-tab gallery-tab--timeline">
    <div v-if="photos.length === 0" class="gallery-empty">还没有作品。</div>
    <template v-else>
      <YearTimeline
        :years="yearList"
        :active-year="activeYear"
        @select="scrollToYear"
      />
      <div class="timeline-content">
        <div
          v-for="group in yearGroups"
          :key="group.year"
          :ref="(el) => { if (el) setGroupRef(el as HTMLElement, group.year) }"
          :data-year="group.year"
          class="timeline-year-section"
        >
          <JustifiedGrid :photos="group.photos" @click="(id) => $emit('open', id)" />
        </div>
      </div>
    </template>
  </section>
</template>
