<!-- docs/.vuepress/themes/layouts/GalleryHome.vue -->
<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { ClientOnly } from 'vuepress/client'
import { useGalleryData } from '../composables/useGalleryData'
import GalleryTabs from '../components/gallery/GalleryTabs.vue'
import TabTimeline from '../components/gallery/TabTimeline.vue'
import TabAlbums from '../components/gallery/TabAlbums.vue'
import TabTags from '../components/gallery/TabTags.vue'
import AlbumDetail from '../components/gallery/AlbumDetail.vue'
import Lightbox from '../components/gallery/Lightbox.vue'
import type { GalleryTab } from '../components/gallery/types'
import { useGalleryRoute } from '../composables/useGalleryRoute'

const { photos, albums, tags, ready, error, reload } = useGalleryData()

const activeTab = ref<GalleryTab>('timeline')
const activeAlbumId = ref<string | null>(null)
const activeTagName = ref<string | null>(null)
const activePhotoId = ref<string | null>(null)
const timelineTab = ref<{ scrollToTop: () => void } | null>(null)
const tagsTab = ref<{ scrollToTop: () => void } | null>(null)
const albumDetail = ref<{ scrollToTop: () => void } | null>(null)

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
    let result = sortedPhotos.value.filter(p => p.albums.includes(activeAlbumId.value!))
    if (activeTagName.value) {
      result = result.filter(p => p.tags.includes(activeTagName.value!))
    }
    return result
  }
  if (activeTab.value === 'tags' && activeTagName.value) {
    return sortedPhotos.value.filter(p => p.tags.includes(activeTagName.value!))
  }
  return sortedPhotos.value
})

const activeAlbum = computed(() =>
  activeAlbumId.value ? albums.value.find(a => a.id === activeAlbumId.value) ?? null : null
)

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
      : activeTab.value === 'tags'
        ? tagsTab.value
        : null

  activeScroller?.scrollToTop()

  const html = document.documentElement
  const body = document.body
  const previousHtmlBehavior = html.style.scrollBehavior
  const previousBodyBehavior = body.style.scrollBehavior

  html.style.scrollBehavior = 'auto'
  body.style.scrollBehavior = 'auto'
  if (!activeScroller) window.scrollTo(0, 0)
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
  activeTagName.value = route.value.tag ?? null
  activePhotoId.value = route.value.p ?? null
}

// 当数据 ready 后再 apply 一次,避免 photo id 找不到时错过
watch(ready, (r) => { if (r) applyRoute() }, { immediate: true })

// 浏览器 hashchange 触发 pull → route 变化 → 同步本地
watch(route, applyRoute, { deep: true })

// 本地状态变化 → 写回 hash(去重避免循环)
watch([activeTab, activeAlbumId, activeTagName, activePhotoId], () => {
  push({
    tab: activeTab.value,
    album: activeAlbumId.value ?? undefined,
    tag: activeTagName.value ?? undefined,
    p: activePhotoId.value ?? undefined,
  })
})

watch([activeTab, activeTagName, activeAlbumId], resetGalleryScroll, { flush: 'post' })

onMounted(async () => { await import('photoswipe/style.css') })
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
            :active-tag="activeTagName"
            @back="backFromAlbum"
            @open="openPhoto"
            @update:active-tag="activeTagName = $event"
          />
        </div>
      </template>
      <template v-else>
        <div class="gallery-home__chrome">
          <GalleryTabs v-model="activeTab" />
        </div>
        <div class="gallery-home__viewport">
          <TabTimeline
            v-if="activeTab === 'timeline'"
            ref="timelineTab"
            :photos="sortedPhotos"
            @open="openPhoto"
          />
          <TabAlbums v-else-if="activeTab === 'albums'" :albums="albums" :photos="sortedPhotos" @open="openAlbum" />
          <TabTags
            v-else
            ref="tagsTab"
            :tags="tags"
            :photos="sortedPhotos"
            v-model:active-tag="activeTagName"
            @open="openPhoto"
          />
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
