<script setup lang="ts">
import { computed } from 'vue'
import { ClientOnly } from 'vuepress/client'
import { RouterLink } from 'vue-router'
import { useGalleryData } from '../composables/useGalleryData'
import type { Photo, PhotoStory } from '../gallery/types'
import { thumbSrc } from '../gallery/photoSources'

const { photos, stories, ready, error, reload } = useGalleryData()

const photoById = computed(() => new Map(photos.value.map((photo) => [photo.id, photo])))

const yearGroups = computed(() => {
  const groups = new Map<number, PhotoStory[]>()
  for (const story of stories.value) {
    const year = new Date(story.date).getFullYear()
    if (!Number.isFinite(year)) continue
    if (!groups.has(year)) groups.set(year, [])
    groups.get(year)!.push(story)
  }

  return [...groups.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, items]) => ({
      year,
      stories: items.sort((a, b) => b.date.localeCompare(a.date)),
    }))
})

function coverFor(story: PhotoStory): Photo | null {
  if (story.cover) {
    const legacyCover = photoById.value.get(story.cover)
    if (legacyCover) return legacyCover
  }

  const storyPhotos = photos.value.filter((photo) => photo.storySlug === story.slug)
  const manifestCover = storyPhotos.find((photo) => photo.isCover)
  if (manifestCover) return manifestCover

  return storyPhotos.reduce<Photo | null>((lowestOrderPhoto, photo) => {
    if (!lowestOrderPhoto) return photo
    return (photo.storyOrder ?? Infinity) < (lowestOrderPhoto.storyOrder ?? Infinity)
      ? photo
      : lowestOrderPhoto
  }, null)
}

function srcOf(photo: Photo) {
  return thumbSrc(photo)
}

</script>

<template>
  <main class="gallery-home">
    <header class="gallery-home__intro">
      <p>A photographic journal.</p>
    </header>

    <div v-if="error" class="gallery-error">
      <p>载入失败:{{ error }}</p>
      <button class="gallery-btn" type="button" @click="reload()">重试</button>
    </div>

    <div v-else-if="!ready" class="gallery-loading">载入中...</div>

    <ClientOnly v-else>
      <section class="gallery-story-index">
        <div
          v-for="group in yearGroups"
          :key="group.year"
          class="gallery-story-year"
        >
          <h2>{{ group.year }}</h2>
          <div class="gallery-story-grid">
            <RouterLink
              v-for="story in group.stories"
              :key="story.slug"
              class="gallery-story-card"
              :to="story.path"
            >
              <span class="gallery-story-card__cover">
                <img
                  v-if="coverFor(story)"
                  :src="srcOf(coverFor(story)!)"
                  :alt="story.title"
                  loading="lazy"
                  decoding="async"
                >
              </span>
              <span class="gallery-story-card__title">{{ story.title }}</span>
              <span v-if="story.location" class="gallery-story-card__meta">{{ story.location }}</span>
              <time class="gallery-story-card__meta" :datetime="story.date">{{ story.date }}</time>
            </RouterLink>
          </div>
        </div>
      </section>
    </ClientOnly>
  </main>
</template>
