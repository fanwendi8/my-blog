<script setup lang="ts">
import { computed, ref } from 'vue'
import { ClientOnly } from 'vuepress/client'
import { useGalleryData } from '../composables/useGalleryData'
import TabTimeline from '../components/gallery/TabTimeline.vue'

const { photos, ready, error, reload } = useGalleryData()
const activeId = ref<string | null>(null)

const sortedPhotos = computed(() => photos.value)

function open(id: string) { activeId.value = id }
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
    </ClientOnly>
  </div>
</template>
