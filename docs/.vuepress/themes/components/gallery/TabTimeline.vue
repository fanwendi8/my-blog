<script setup lang="ts">
import { computed, ref, nextTick, onMounted, onUnmounted, watch } from 'vue'
import JustifiedGrid from './JustifiedGrid.vue'
import YearTimeline from './YearTimeline.vue'
import type { Photo } from './types'
import { getActiveTimelineYear } from './timelineActiveYear'

const props = defineProps<{
  photos: Photo[]
}>()
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
const timelineContent = ref<HTMLElement | null>(null)

const groupRefs = new Map<number, HTMLElement>()

function setGroupRef(el: HTMLElement, year: number) {
  groupRefs.set(year, el)
}

const isProgrammaticScroll = ref(false)
let scrollTimeout: ReturnType<typeof setTimeout> | null = null
let scrollListener: (() => void) | null = null
let rafId: number | null = null
let activeScrollTarget: HTMLElement | Window | null = null

function getScrollTarget() {
  return timelineContent.value ?? window
}

function listenToScrollTarget() {
  const next = getScrollTarget()
  if (activeScrollTarget === next) return
  activeScrollTarget?.removeEventListener('scroll', scheduleActiveYearSync)
  activeScrollTarget = next
  activeScrollTarget.addEventListener('scroll', scheduleActiveYearSync, { passive: true })
}

function getActiveAnchorY() {
  const viewportTop = timelineContent.value?.getBoundingClientRect().top ?? 0
  const viewportHeight = timelineContent.value?.clientHeight ?? window.innerHeight
  const tabsBottom = viewportTop
  const minAnchor = viewportTop + 96
  const maxAnchor = viewportTop + viewportHeight * 0.45
  return Math.min(Math.max(tabsBottom + 20, minAnchor), maxAnchor)
}

function syncActiveYear() {
  const nextYear = getActiveTimelineYear(
    [...groupRefs.entries()].map(([year, el]) => {
      const rect = el.getBoundingClientRect()
      return { year, top: rect.top, bottom: rect.bottom }
    }),
    getActiveAnchorY()
  )

  if (nextYear !== null) activeYear.value = nextYear
}

function scheduleActiveYearSync() {
  if (isProgrammaticScroll.value || rafId !== null) return

  rafId = window.requestAnimationFrame(() => {
    rafId = null
    syncActiveYear()
  })
}

function scrollToYear(year: number) {
  activeYear.value = year
  isProgrammaticScroll.value = true

  // 清除之前的 timeout 和监听器
  if (scrollTimeout) clearTimeout(scrollTimeout)
  if (scrollListener) {
    getScrollTarget().removeEventListener('scroll', scrollListener)
    scrollListener = null
  }

  const el = groupRefs.get(year)
  if (el && timelineContent.value) {
    const viewportRect = timelineContent.value.getBoundingClientRect()
    const targetRect = el.getBoundingClientRect()
    const top = timelineContent.value.scrollTop + targetRect.top - viewportRect.top
    timelineContent.value.scrollTo({ top, behavior: 'smooth' })
  } else if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // 用 scroll 事件 debounce 检测滚动真正结束
  const scrollTarget = getScrollTarget()
  let lastScrollTop = timelineContent.value?.scrollTop ?? window.scrollY
  scrollListener = () => {
    const st = timelineContent.value?.scrollTop ?? window.scrollY
    if (st !== lastScrollTop) {
      lastScrollTop = st
      if (scrollTimeout) clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        isProgrammaticScroll.value = false
        syncActiveYear()
        if (scrollListener) {
          scrollTarget.removeEventListener('scroll', scrollListener)
          scrollListener = null
        }
      }, 150)
    }
  }
  scrollTarget.addEventListener('scroll', scrollListener)

  // fallback：如果目标已经在可视区域内，可能不会有 scroll 事件
  scrollTimeout = setTimeout(() => {
    isProgrammaticScroll.value = false
    syncActiveYear()
    if (scrollListener) {
      scrollTarget.removeEventListener('scroll', scrollListener)
      scrollListener = null
    }
  }, 1500)
}

onMounted(async () => {
  await nextTick()

  syncActiveYear()
  listenToScrollTarget()
  window.addEventListener('resize', scheduleActiveYearSync)
})

onUnmounted(() => {
  activeScrollTarget?.removeEventListener('scroll', scheduleActiveYearSync)
  activeScrollTarget = null
  window.removeEventListener('resize', scheduleActiveYearSync)
  if (rafId !== null) window.cancelAnimationFrame(rafId)
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
    scrollTimeout = null
  }
  if (scrollListener) {
    getScrollTarget().removeEventListener('scroll', scrollListener)
    scrollListener = null
  }
})

watch(yearList, (years) => {
  if (years.length === 0) {
    activeYear.value = null
    return
  }

  if (!years.some((item) => item.year === activeYear.value)) {
    activeYear.value = years[0].year
  }

  nextTick(syncActiveYear)
})

function scrollToTop() {
  if (timelineContent.value) {
    timelineContent.value.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    timelineContent.value.scrollTop = 0
  }
}

defineExpose({ scrollToTop })
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
      <div ref="timelineContent" class="timeline-content">
        <div
          v-for="group in yearGroups"
          :key="group.year"
          :ref="(el) => { if (el) setGroupRef(el as HTMLElement, group.year) }"
          :data-year="group.year"
          class="timeline-year-section"
        >
          <JustifiedGrid :photos="group.photos" :scroll-ref="timelineContent" @click="(id) => $emit('open', id)" />
        </div>
      </div>
    </template>
  </section>
</template>
