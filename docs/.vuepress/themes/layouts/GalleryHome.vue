<!-- docs/.vuepress/themes/layouts/GalleryHome.vue -->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ClientOnly } from 'vuepress/client'
import { useGalleryData } from '../composables/useGalleryData'
import GalleryTabs from '../components/gallery/GalleryTabs.vue'
import TabTimeline from '../components/gallery/TabTimeline.vue'
import TabAlbums from '../components/gallery/TabAlbums.vue'
import AlbumDetail from '../components/gallery/AlbumDetail.vue'
import Lightbox from '../components/gallery/Lightbox.vue'
import type { GalleryTab } from '../components/gallery/types'
import { useGalleryRoute } from '../composables/useGalleryRoute'

const { photos, albums, tags, ready, error, reload } = useGalleryData()

const activeTab = ref<GalleryTab>('timeline')
const activeAlbumId = ref<string | null>(null)
const activeTags = ref<string[]>([])
const activePhotoId = ref<string | null>(null)
const isFilterOpen = ref(false)
const timelineTab = ref<{ scrollToTop: () => void } | null>(null)
const albumDetail = ref<{ scrollToTop: () => void } | null>(null)
const filterRoot = ref<HTMLElement | null>(null)

const sortedPhotos = computed(() => photos.value)

const galleryYearRange = computed(() => {
  const years = photos.value
    .map((photo) => new Date(photo.takenAt).getFullYear())
    .filter((year) => Number.isFinite(year))

  if (years.length === 0) return '时光采样'

  const min = Math.min(...years)
  const max = Math.max(...years)
  return min === max ? `${max}` : `${min}-${max}`
})

const visiblePhotos = computed(() => {
  if (activeAlbumId.value) {
    return sortedPhotos.value.filter(p => p.albums.includes(activeAlbumId.value!))
  }
  if (activeTab.value === 'timeline') {
    return timelinePhotos.value
  }
  return sortedPhotos.value
})

const activeAlbum = computed(() =>
  activeAlbumId.value ? albums.value.find(a => a.id === activeAlbumId.value) ?? null : null
)

const timelinePhotos = computed(() => {
  if (activeTags.value.length === 0) return sortedPhotos.value
  const selected = new Set(activeTags.value)
  return sortedPhotos.value.filter((photo) => photo.tags.some((tag) => selected.has(tag)))
})

const activeTagSummary = computed(() => {
  if (activeTags.value.length === 0) return '筛选'
  return `${activeTags.value.length}`
})

function openPhoto(id: string) { activePhotoId.value = id }
function closePhoto() { activePhotoId.value = null }
function navigatePhoto(id: string) { activePhotoId.value = id }

function openAlbum(id: string) { activeAlbumId.value = id }
function backFromAlbum() { activeAlbumId.value = null }

function forceScrollTop() {
  const activeScroller = activeAlbum.value
    ? albumDetail.value
    : activeTab.value === 'timeline'
      ? timelineTab.value
        : null

  if (activeScroller?.scrollToTop) {
    activeScroller.scrollToTop()
  } else {
    window.scrollTo(0, 0)
  }

  const html = document.documentElement
  const body = document.body
  const previousHtmlBehavior = html.style.scrollBehavior
  const previousBodyBehavior = body.style.scrollBehavior

  html.style.scrollBehavior = 'auto'
  body.style.scrollBehavior = 'auto'
  if (document.scrollingElement) document.scrollingElement.scrollTop = 0

  requestAnimationFrame(() => {
    html.style.scrollBehavior = previousHtmlBehavior
    body.style.scrollBehavior = previousBodyBehavior
  })
}

async function resetGalleryScroll() {
  await nextTick()
  if (typeof window === 'undefined') return

  forceScrollTop()
  requestAnimationFrame(forceScrollTop)
  window.setTimeout(forceScrollTop, 80)
  window.setTimeout(forceScrollTop, 180)
}

const { route, push, pull } = useGalleryRoute()

// 初始化:把 hash 同步到本地状态
function applyRoute() {
  activeTab.value = route.value.tab
  activeAlbumId.value = route.value.album ?? null
  activeTags.value = route.value.tags ?? (route.value.tag ? [route.value.tag] : [])
  activePhotoId.value = route.value.p ?? null
}

// 当数据 ready 后再 apply 一次,避免 photo id 找不到时错过
watch(ready, (r) => { if (r) applyRoute() }, { immediate: true })

// 浏览器 hashchange 触发 pull → route 变化 → 同步本地
watch(route, applyRoute, { deep: true })

// 本地状态变化 → 写回 hash(去重避免循环)
watch([activeTab, activeAlbumId, activeTags, activePhotoId], () => {
  push({
    tab: activeTab.value,
    album: activeAlbumId.value ?? undefined,
    tags: activeTab.value === 'timeline' ? activeTags.value : undefined,
    p: activePhotoId.value ?? undefined,
  })
}, { deep: true })

watch([activeTab, activeTags, activeAlbumId], resetGalleryScroll, { flush: 'post', deep: true })

watch(activeTab, () => { isFilterOpen.value = false })

function toggleFilter() {
  isFilterOpen.value = !isFilterOpen.value
}

function toggleTag(name: string) {
  activeTags.value = activeTags.value.includes(name)
    ? activeTags.value.filter((tag) => tag !== name)
    : [...activeTags.value, name]
}

function clearTags() {
  activeTags.value = []
}

function handleDocumentClick(event: MouseEvent) {
  const target = event.target
  if (target instanceof Node && !filterRoot.value?.contains(target)) {
    isFilterOpen.value = false
  }
}

onMounted(async () => {
  document.addEventListener('click', handleDocumentClick)
  await import('photoswipe/style.css')
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <div class="gallery-home">
    <header class="gallery-home__header">
      <p class="gallery-home__sub">
        <span>{{ photos.length }} 帧光影</span>
        <span>{{ galleryYearRange }}</span>
      </p>
    </header>

    <div v-if="error" class="gallery-error">
      <p>载入失败:{{ error }}</p>
      <button class="gallery-btn" @click="reload()">重试</button>
    </div>

    <div v-else-if="!ready" class="gallery-loading">载入中...</div>

    <ClientOnly v-else>
      <template v-if="activeAlbum">
        <div class="gallery-home__viewport">
          <AlbumDetail
            ref="albumDetail"
            :album="activeAlbum"
            :photos="sortedPhotos"
            @back="backFromAlbum"
            @open="openPhoto"
          />
        </div>
      </template>
      <template v-else>
        <div class="gallery-home__chrome">
          <GalleryTabs v-model="activeTab" />
          <div v-if="activeTab === 'timeline'" ref="filterRoot" class="gallery-filter">
            <button
              class="gallery-filter__toggle"
              :class="{ 'is-active': activeTags.length > 0 || isFilterOpen }"
              type="button"
              aria-label="筛选标签"
              :aria-expanded="isFilterOpen"
              @click.stop="toggleFilter"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 6h16M7 12h10M10 18h4" />
              </svg>
              <span v-if="activeTags.length > 0" class="gallery-filter__badge">{{ activeTagSummary }}</span>
            </button>
            <div v-if="isFilterOpen" class="gallery-filter__panel">
              <div class="gallery-filter__head">
                <span>标签筛选</span>
                <button type="button" :disabled="activeTags.length === 0" @click="clearTags">清空</button>
              </div>
              <div class="gallery-filter__chips">
                <button
                  v-for="tag in tags"
                  :key="tag.name"
                  class="gallery-filter__chip"
                  :class="{ 'is-active': activeTags.includes(tag.name) }"
                  type="button"
                  @click="toggleTag(tag.name)"
                >
                  <span>{{ tag.name }}</span>
                  <span>{{ tag.count }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="gallery-home__viewport">
          <TabTimeline
            v-if="activeTab === 'timeline'"
            ref="timelineTab"
            :photos="timelinePhotos"
            @open="openPhoto"
          />
          <TabAlbums v-else-if="activeTab === 'albums'" :albums="albums" :photos="sortedPhotos" @open="openAlbum" />
        </div>
      </template>

      <Lightbox
        :photos="visiblePhotos"
        :active-id="activePhotoId"
        @close="closePhoto"
        @navigate="navigatePhoto"
      />
    </ClientOnly>
  </div>
</template>
