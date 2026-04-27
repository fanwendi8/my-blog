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

const isProgrammaticScroll = ref(false)
let scrollTimeout: ReturnType<typeof setTimeout> | null = null

function scrollToYear(year: number) {
  activeYear.value = year
  isProgrammaticScroll.value = true
  if (scrollTimeout) clearTimeout(scrollTimeout)

  const el = groupRefs.get(year)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  scrollTimeout = setTimeout(() => {
    isProgrammaticScroll.value = false
  }, 800)
}

let observer: IntersectionObserver | null = null

onMounted(async () => {
  await nextTick()

  observer = new IntersectionObserver(
    (entries) => {
      if (isProgrammaticScroll.value) return

      const visible = entries.filter((e) => e.isIntersecting)
      if (visible.length === 0) return

      const best = visible.reduce((prev, curr) => {
        if (curr.intersectionRatio !== prev.intersectionRatio) {
          return curr.intersectionRatio > prev.intersectionRatio ? curr : prev
        }
        const prevTop = prev.target.getBoundingClientRect().top
        const currTop = curr.target.getBoundingClientRect().top
        return currTop < prevTop ? curr : prev
      })

      const year = Number((best.target as HTMLElement).dataset.year)
      activeYear.value = year
    },
    { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] }
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
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
    scrollTimeout = null
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
