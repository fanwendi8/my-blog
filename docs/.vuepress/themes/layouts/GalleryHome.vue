<script setup lang="ts">
import { computed, ref } from 'vue'
import { ClientOnly } from 'vuepress/client'
import { useGalleryData } from '../composables/useGalleryData'
import TabTimeline from '../components/gallery/TabTimeline.vue'
import { onMounted } from 'vue'
import Lightbox from '../components/gallery/Lightbox.vue'

const { photos, ready, error, reload } = useGalleryData()
const activeId = ref<string | null>(null)

const sortedPhotos = computed(() => photos.value)

function open(id: string) { activeId.value = id }

const cdnPhoto = computed(() => activeId.value
  ? sortedPhotos.value.find(p => p.id === activeId.value) ?? null
  : null
)

function close() { activeId.value = null }
function navigate(id: string) { activeId.value = id }

onMounted(async () => {
  // PhotoSwipe v5 默认样式 - 仅客户端 import
  await import('photoswipe/style.css')
})
</script>

<template>
  <div class="gallery-home">
    <header class="gallery-home__header">
      <h1>瞳画</h1>
      <p class="gallery-home__sub">{{ photos.length }} 件作品</p>
    </header>

    <div v-if="error" class="gallery-error">
      <p>载入失败:{{ error }}</p>
      <button class="gallery-btn" @click="reload()">重试</button>
    </div>

    <div v-else-if="!ready" class="gallery-loading">载入中...</div>

    <ClientOnly v-else>
      <TabTimeline :photos="sortedPhotos" @open="open" />
      <Lightbox
        :photos="sortedPhotos"
        :active-id="activeId"
        @close="close"
        @navigate="navigate"
      />
    </ClientOnly>
  </div>
</template>
