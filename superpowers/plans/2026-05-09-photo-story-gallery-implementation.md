# Photo Story Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the existing photo-first gallery into a lightweight Markdown-authored photographic story system.

**Architecture:** Keep VuePress Plume and the existing custom gallery page entry. Replace the timeline/tag/EXIF-heavy model with story metadata loaded from `stories.json`, story prose authored in Markdown, and Vue components that render story headers, ordered photos, and a clean PhotoSwipe viewer.

**Tech Stack:** VuePress 2, Vue 3, vuepress-theme-plume, Vitest, @vue/test-utils, PhotoSwipe, existing Node gallery scripts.

---

## File Structure

- Modify `docs/.vuepress/themes/gallery/types.ts`: define minimal `Photo` and new `PhotoStory`.
- Modify `scripts/gallery/manifest.mjs`: add `buildStories`, simplify album/tag assumptions.
- Modify `scripts/gallery/build.mjs`: write `stories.json` and stop relying on tag/album output for the new UI.
- Create `scripts/gallery/stories.config.mjs`: story definitions and ordered photo ids.
- Modify `docs/.vuepress/themes/composables/useGalleryData.ts`: fetch `photos.json` and `stories.json`.
- Modify `docs/.vuepress/themes/layouts/GalleryHome.vue`: render story index grouped by year.
- Create `docs/.vuepress/themes/components/gallery/PhotoStoryHeader.vue`: Markdown story heading from frontmatter.
- Create `docs/.vuepress/themes/components/gallery/PhotoStoryGallery.vue`: ordered story image flow from frontmatter.
- Modify `docs/.vuepress/themes/components/gallery/Lightbox.vue`: clean viewer, no info panel.
- Modify `docs/.vuepress/client.ts`: register new Markdown components.
- Modify `docs/.vuepress/themes/styles/_gallery.scss`: replace old timeline/tag/panel styling with index/story/lightbox styling.
- Create `docs/gallery/example-story.md`: local example story page for build and visual verification.
- Update tests under `docs/.vuepress/themes/__tests__/` and `scripts/gallery/__tests__/`.

## Task 1: Types and Manifest Story Model

**Files:**
- Modify: `docs/.vuepress/themes/gallery/types.ts`
- Modify: `scripts/gallery/manifest.mjs`
- Create: `scripts/gallery/stories.config.mjs`
- Modify: `scripts/gallery/__tests__/manifest.test.mjs`

- [ ] **Step 1: Write failing manifest tests**

Add these tests to `scripts/gallery/__tests__/manifest.test.mjs`:

```js
import { describe, it, expect } from 'vitest'
import {
  mergePhotos,
  buildStories,
  validateStoryRefs,
} from '../manifest.mjs'

const photoA = {
  id: 'a',
  src: '/gallery-img/a/large.webp',
  w: 600,
  h: 400,
  alt: 'A',
}

const photoB = {
  id: 'b',
  src: '/gallery-img/b/large.webp',
  w: 600,
  h: 400,
  alt: 'B',
}

describe('buildStories', () => {
  it('returns stories with counts, paths, and config order', () => {
    const cfg = [
      {
        slug: 'cyprus-2023',
        title: 'Cyprus',
        date: '2023-10-22',
        location: 'Cyprus',
        cover: 'a',
        photos: ['b', 'a'],
      },
    ]

    const out = buildStories(cfg, [photoA, photoB])

    expect(out).toEqual([
      {
        slug: 'cyprus-2023',
        title: 'Cyprus',
        date: '2023-10-22',
        location: 'Cyprus',
        cover: 'a',
        count: 2,
        photos: ['b', 'a'],
        path: '/gallery/cyprus-2023/',
      },
    ])
  })

  it('uses the first story photo as cover when cover is missing', () => {
    const cfg = [{ slug: 'walk', title: 'Walk', date: '2025-01-01', photos: ['b'] }]
    expect(buildStories(cfg, [photoA, photoB])[0].cover).toBe('b')
  })
})

describe('validateStoryRefs', () => {
  it('throws when a story references an unknown photo id', () => {
    const cfg = [{ slug: 'broken', title: 'Broken', date: '2025-01-01', photos: ['ghost'] }]
    expect(() => validateStoryRefs(cfg, [photoA, photoB])).toThrow(/ghost/)
  })
})
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm run gallery:test -- scripts/gallery/__tests__/manifest.test.mjs
```

Expected: FAIL because `buildStories` and `validateStoryRefs` are not exported.

- [ ] **Step 3: Update gallery types**

Replace `docs/.vuepress/themes/gallery/types.ts` with:

```ts
export interface Photo {
  id: string
  src: string | PhotoSourceSet
  w: number
  h: number
  alt?: string
  title?: string | null
  caption?: string | null
}

export interface PhotoSourceSet {
  thumb?: string
  preview?: string
  large: string
  xlarge?: string
}

export interface PhotoStory {
  slug: string
  title: string
  date: string
  location?: string | null
  cover: string | null
  count: number
  photos: string[]
  path: string
}
```

- [ ] **Step 4: Implement story manifest helpers**

In `scripts/gallery/manifest.mjs`, keep `mergePhotos` and replace album/tag helpers with:

```js
export function validateStoryRefs(storyCfg, photos) {
  const ids = new Set(photos.map(p => p.id))
  for (const story of storyCfg) {
    for (const pid of story.photos ?? []) {
      if (!ids.has(pid)) throw new Error(`Story "${story.slug}" references unknown photo id: ${pid}`)
    }
    if (story.cover && !ids.has(story.cover)) {
      throw new Error(`Story "${story.slug}" references unknown cover photo id: ${story.cover}`)
    }
  }
}

export function buildStories(storyCfg, photos) {
  validateStoryRefs(storyCfg, photos)
  const byId = new Map(photos.map(p => [p.id, p]))

  return storyCfg.map(story => {
    const ordered = story.photos ?? []
    const cover = story.cover && byId.has(story.cover)
      ? story.cover
      : ordered[0] ?? null

    return {
      slug: story.slug,
      title: story.title,
      date: story.date,
      location: story.location ?? null,
      cover,
      count: ordered.length,
      photos: ordered,
      path: story.path ?? `/gallery/${story.slug}/`,
    }
  })
}

export async function writeManifest(dir, { photos, stories }) {
  await fs.mkdir(dir, { recursive: true })
  await atomicWrite(path.join(dir, 'photos.json'), JSON.stringify(photos))
  await atomicWrite(path.join(dir, 'stories.json'), JSON.stringify(stories))
}
```

- [ ] **Step 5: Add initial story config**

Create `scripts/gallery/stories.config.mjs`:

```js
// scripts/gallery/stories.config.mjs
// Story definitions for the Markdown-first gallery.
// The photo ids must exist in photos.json after running gallery:build.

export default []
```

- [ ] **Step 6: Run manifest tests**

Run:

```bash
npm run gallery:test -- scripts/gallery/__tests__/manifest.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add docs/.vuepress/themes/gallery/types.ts scripts/gallery/manifest.mjs scripts/gallery/stories.config.mjs scripts/gallery/__tests__/manifest.test.mjs
git commit -m "feat(gallery): add photo story manifest model"
```

## Task 2: Runtime Data Loader

**Files:**
- Modify: `docs/.vuepress/themes/composables/useGalleryData.ts`
- Modify: `docs/.vuepress/themes/__tests__/useGalleryData.test.ts`

- [ ] **Step 1: Write failing loader test**

Replace `docs/.vuepress/themes/__tests__/useGalleryData.test.ts` with:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { useGalleryData, __resetGalleryData } from '../composables/useGalleryData'

const PHOTOS = [{ id: 'a', src: '/gallery-img/a/large.webp', w: 600, h: 400, alt: 'A' }]
const STORIES = [{
  slug: 'daily',
  title: 'Daily',
  date: '2025-01-01',
  location: 'Beijing',
  cover: 'a',
  count: 1,
  photos: ['a'],
  path: '/gallery/daily/',
}]

beforeEach(() => {
  __resetGalleryData()
  globalThis.fetch = vi.fn((url: string) => {
    const body = url.endsWith('photos.json') ? PHOTOS : STORIES
    return Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response)
  })
})

describe('useGalleryData', () => {
  it('fetches photos and stories manifests', async () => {
    const { photos, stories, ready } = useGalleryData()

    expect(ready.value).toBe(false)
    await flushPromises()

    expect(ready.value).toBe(true)
    expect(photos.value[0].id).toBe('a')
    expect(stories.value[0].slug).toBe('daily')
    expect(globalThis.fetch).toHaveBeenCalledWith('/gallery/data/photos.json', { cache: 'no-store' })
    expect(globalThis.fetch).toHaveBeenCalledWith('/gallery/data/stories.json', { cache: 'no-store' })
  })

  it('shares loaded state between calls', async () => {
    useGalleryData()
    await flushPromises()
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
    useGalleryData()
    await flushPromises()
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
  })

  it('records error state on fetch failure', async () => {
    __resetGalleryData()
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('boom')))

    const { error, ready } = useGalleryData()
    await flushPromises()

    expect(ready.value).toBe(false)
    expect(error.value).toMatch(/boom/)
  })
})
```

- [ ] **Step 2: Run test to verify failure**

```bash
npm test -- docs/.vuepress/themes/__tests__/useGalleryData.test.ts
```

Expected: FAIL because `stories` does not exist.

- [ ] **Step 3: Implement data loader**

Replace `docs/.vuepress/themes/composables/useGalleryData.ts` with:

```ts
import { ref, type Ref } from 'vue'
import type { Photo, PhotoStory } from '../gallery/types'

interface Store {
  photos: Ref<Photo[]>
  stories: Ref<PhotoStory[]>
  ready: Ref<boolean>
  error: Ref<string | null>
  reload: () => Promise<void>
}

let store: Store | null = null

export function __resetGalleryData() { store = null }

const BASE = '/gallery/data'

async function fetchManifest<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE}/${path}`, { cache: 'no-store' })
  if (!response.ok) throw new Error(path)
  return response.json()
}

function create(): Store {
  const photos = ref<Photo[]>([])
  const stories = ref<PhotoStory[]>([])
  const ready = ref(false)
  const error = ref<string | null>(null)

  async function reload() {
    error.value = null
    ready.value = false
    try {
      const [p, s] = await Promise.all([
        fetchManifest<Photo[]>('photos.json'),
        fetchManifest<PhotoStory[]>('stories.json'),
      ])
      photos.value = p
      stories.value = s
      ready.value = true
    } catch (e) {
      error.value = (e as Error).message
    }
  }

  reload()
  return { photos, stories, ready, error, reload }
}

export function useGalleryData(): Store {
  if (!store) store = create()
  return store
}
```

- [ ] **Step 4: Run loader test**

```bash
npm test -- docs/.vuepress/themes/__tests__/useGalleryData.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/.vuepress/themes/composables/useGalleryData.ts docs/.vuepress/themes/__tests__/useGalleryData.test.ts
git commit -m "feat(gallery): load photo stories at runtime"
```

## Task 3: Markdown Story Components

**Files:**
- Create: `docs/.vuepress/themes/components/gallery/PhotoStoryHeader.vue`
- Create: `docs/.vuepress/themes/components/gallery/PhotoStoryGallery.vue`
- Modify: `docs/.vuepress/client.ts`
- Create: `docs/.vuepress/themes/__tests__/PhotoStoryGallery.test.ts`

- [ ] **Step 1: Write failing component test**

Create `docs/.vuepress/themes/__tests__/PhotoStoryGallery.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import PhotoStoryGallery from '../components/gallery/PhotoStoryGallery.vue'

vi.mock('vuepress/client', () => ({
  usePageFrontmatter: () => ref({
    photos: ['b', 'a'],
  }),
}))

vi.mock('../composables/useGalleryData', () => ({
  useGalleryData: () => ({
    photos: ref([
      { id: 'a', src: '/a.webp', w: 600, h: 400, alt: 'A' },
      { id: 'b', src: '/b.webp', w: 400, h: 600, alt: 'B' },
    ]),
    stories: ref([]),
    ready: ref(true),
    error: ref(null),
    reload: vi.fn(),
  }),
}))

vi.mock('../components/gallery/Lightbox.vue', () => ({
  default: defineComponent({
    props: ['photos', 'activeId'],
    setup(props) {
      return () => h('div', { class: 'lightbox-stub', 'data-active': props.activeId ?? '' })
    },
  }),
}))

describe('PhotoStoryGallery', () => {
  it('renders photos in frontmatter order', async () => {
    const wrapper = mount(PhotoStoryGallery)
    await flushPromises()

    const images = wrapper.findAll('img')
    expect(images).toHaveLength(2)
    expect(images[0].attributes('src')).toBe('/b.webp')
    expect(images[1].attributes('src')).toBe('/a.webp')
  })

  it('opens the lightbox when an image is clicked', async () => {
    const wrapper = mount(PhotoStoryGallery)
    await wrapper.find('button.photo-story-gallery__image').trigger('click')

    expect(wrapper.find('.lightbox-stub').attributes('data-active')).toBe('b')
  })
})
```

- [ ] **Step 2: Run test to verify failure**

```bash
npm test -- docs/.vuepress/themes/__tests__/PhotoStoryGallery.test.ts
```

Expected: FAIL because `PhotoStoryGallery.vue` does not exist.

- [ ] **Step 3: Create `PhotoStoryHeader.vue`**

Create `docs/.vuepress/themes/components/gallery/PhotoStoryHeader.vue`:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { usePageFrontmatter } from 'vuepress/client'

interface StoryFrontmatter {
  title?: string
  date?: string
  location?: string
}

const frontmatter = usePageFrontmatter<StoryFrontmatter>()

const formattedDate = computed(() => {
  if (!frontmatter.value.date) return null
  try {
    return new Date(frontmatter.value.date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return frontmatter.value.date
  }
})
</script>

<template>
  <header class="photo-story-header">
    <h1>{{ frontmatter.title }}</h1>
    <p class="photo-story-header__meta">
      <time v-if="formattedDate">{{ formattedDate }}</time>
      <span v-if="frontmatter.location">{{ frontmatter.location }}</span>
    </p>
  </header>
</template>
```

- [ ] **Step 4: Create `PhotoStoryGallery.vue`**

Create `docs/.vuepress/themes/components/gallery/PhotoStoryGallery.vue`:

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePageFrontmatter } from 'vuepress/client'
import { useGalleryData } from '../../composables/useGalleryData'
import type { Photo } from '../../gallery/types'
import Lightbox from './Lightbox.vue'

interface StoryFrontmatter {
  photos?: string[]
}

const frontmatter = usePageFrontmatter<StoryFrontmatter>()
const { photos } = useGalleryData()
const activeId = ref<string | null>(null)

const storyPhotos = computed<Photo[]>(() => {
  const byId = new Map(photos.value.map((photo) => [photo.id, photo]))
  return (frontmatter.value.photos ?? [])
    .map((id) => byId.get(id))
    .filter((photo): photo is Photo => Boolean(photo))
})

function srcOf(photo: Photo) {
  return typeof photo.src === 'string' ? photo.src : photo.src.large
}
</script>

<template>
  <section class="photo-story-gallery">
    <figure
      v-for="photo in storyPhotos"
      :key="photo.id"
      class="photo-story-gallery__figure"
    >
      <button
        type="button"
        class="photo-story-gallery__image"
        @click="activeId = photo.id"
      >
        <img
          :src="srcOf(photo)"
          :alt="photo.alt ?? photo.title ?? ''"
          loading="lazy"
          decoding="async"
          :width="photo.w"
          :height="photo.h"
        >
      </button>
      <figcaption v-if="photo.caption">{{ photo.caption }}</figcaption>
    </figure>

    <Lightbox
      :photos="storyPhotos"
      :active-id="activeId"
      @close="activeId = null"
      @navigate="activeId = $event"
    />
  </section>
</template>
```

- [ ] **Step 5: Register components globally**

Modify `docs/.vuepress/client.ts`:

```ts
import PhotoStoryHeader from './themes/components/gallery/PhotoStoryHeader.vue'
import PhotoStoryGallery from './themes/components/gallery/PhotoStoryGallery.vue'
```

Inside `enhance({ app })`, add:

```ts
app.component('PhotoStoryHeader', PhotoStoryHeader)
app.component('PhotoStoryGallery', PhotoStoryGallery)
```

- [ ] **Step 6: Run component test**

```bash
npm test -- docs/.vuepress/themes/__tests__/PhotoStoryGallery.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add docs/.vuepress/client.ts docs/.vuepress/themes/components/gallery/PhotoStoryHeader.vue docs/.vuepress/themes/components/gallery/PhotoStoryGallery.vue docs/.vuepress/themes/__tests__/PhotoStoryGallery.test.ts
git commit -m "feat(gallery): add markdown photo story components"
```

## Task 4: Story Index Home

**Files:**
- Modify: `docs/.vuepress/themes/layouts/GalleryHome.vue`
- Modify: `docs/.vuepress/themes/__tests__/GalleryHome.test.ts`

- [ ] **Step 1: Write failing story-index test**

Replace `docs/.vuepress/themes/__tests__/GalleryHome.test.ts` with:

```ts
import { describe, it, expect, vi } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import GalleryHome from '../layouts/GalleryHome.vue'

vi.mock('vuepress/client', () => ({
  ClientOnly: defineComponent({
    setup(_, { slots }) {
      return () => slots.default?.()
    },
  }),
}))

vi.mock('../composables/useGalleryData', () => ({
  useGalleryData: () => ({
    photos: ref([
      { id: 'a', src: '/a.webp', w: 600, h: 400, alt: 'A' },
      { id: 'b', src: '/b.webp', w: 600, h: 400, alt: 'B' },
    ]),
    stories: ref([
      { slug: 'late', title: 'Late', date: '2025-01-01', location: 'Beijing', cover: 'a', count: 1, photos: ['a'], path: '/gallery/late/' },
      { slug: 'early', title: 'Early', date: '2024-01-01', location: 'Tokyo', cover: 'b', count: 1, photos: ['b'], path: '/gallery/early/' },
    ]),
    ready: ref(true),
    error: ref(null),
    reload: vi.fn(),
  }),
}))

describe('GalleryHome', () => {
  it('renders stories grouped by year and links to story pages', () => {
    const wrapper = mount(GalleryHome, {
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    expect(wrapper.find('.gallery-story-index').exists()).toBe(true)
    expect(wrapper.text()).toContain('2025')
    expect(wrapper.text()).toContain('2024')
    expect(wrapper.findAll('.gallery-story-card')).toHaveLength(2)
    expect(wrapper.findComponent(RouterLinkStub).props('to')).toBe('/gallery/late/')
  })
})
```

- [ ] **Step 2: Run test to verify failure**

```bash
npm test -- docs/.vuepress/themes/__tests__/GalleryHome.test.ts
```

Expected: FAIL because current `GalleryHome` still renders filters and timeline.

- [ ] **Step 3: Replace `GalleryHome.vue`**

Replace `docs/.vuepress/themes/layouts/GalleryHome.vue` with:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { ClientOnly, RouterLink } from 'vuepress/client'
import { useGalleryData } from '../composables/useGalleryData'
import type { Photo, PhotoStory } from '../gallery/types'

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
  return story.cover ? photoById.value.get(story.cover) ?? null : null
}

function srcOf(photo: Photo) {
  return typeof photo.src === 'string' ? photo.src : photo.src.large
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
            </RouterLink>
          </div>
        </div>
      </section>
    </ClientOnly>
  </main>
</template>
```

- [ ] **Step 4: Run story-index test**

```bash
npm test -- docs/.vuepress/themes/__tests__/GalleryHome.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/.vuepress/themes/layouts/GalleryHome.vue docs/.vuepress/themes/__tests__/GalleryHome.test.ts
git commit -m "feat(gallery): render story index home"
```

## Task 5: Clean Lightbox

**Files:**
- Modify: `docs/.vuepress/themes/components/gallery/Lightbox.vue`
- Modify: `docs/.vuepress/themes/__tests__/Lightbox.test.ts`

- [ ] **Step 1: Update failing lightbox test**

Replace the last test in `docs/.vuepress/themes/__tests__/Lightbox.test.ts` with:

```ts
it('renders a clean stage without the old info panel', async () => {
  const w = mount(Lightbox, {
    props: { photos: [photo('a'), photo('b')], activeId: 'a' },
  })
  await flushPromises()
  expect(w.find('.gallery-lightbox__stage').exists()).toBe(true)
  expect(w.find('.gallery-lightbox__panel').exists()).toBe(false)
  expect(w.findComponent({ name: 'PhotoInfoPanel' }).exists()).toBe(false)
})
```

- [ ] **Step 2: Run test to verify failure**

```bash
npm test -- docs/.vuepress/themes/__tests__/Lightbox.test.ts
```

Expected: FAIL because current lightbox renders `.gallery-lightbox__panel`.

- [ ] **Step 3: Simplify `Lightbox.vue`**

Edit `docs/.vuepress/themes/components/gallery/Lightbox.vue`:

- remove `PhotoInfoPanel` import
- remove drawer refs/state/functions
- remove `currentPhoto`
- keep PhotoSwipe setup and navigation emit
- replace template with:

```vue
<template>
  <div v-if="activeId" class="gallery-lightbox gallery-lightbox--clean">
    <div ref="pswpContainer" class="gallery-lightbox__stage"></div>
  </div>
</template>
```

The `open()` function should use:

```ts
pswp = new PhotoSwipe({
  dataSource,
  index: idx,
  bgOpacity: 1,
  showHideAnimationType: 'fade',
  appendToEl: container,
  initialZoomLevel: 'fit',
  secondaryZoomLevel: 'fill',
  getViewportSizeFn: () => ({
    x: container.clientWidth,
    y: container.clientHeight,
  }),
})
```

- [ ] **Step 4: Run lightbox test**

```bash
npm test -- docs/.vuepress/themes/__tests__/Lightbox.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/.vuepress/themes/components/gallery/Lightbox.vue docs/.vuepress/themes/__tests__/Lightbox.test.ts
git commit -m "feat(gallery): simplify lightbox for photo stories"
```

## Task 6: Styles and Example Markdown Story

**Files:**
- Modify: `docs/.vuepress/themes/styles/_gallery.scss`
- Create: `docs/gallery/example-story.md`

- [ ] **Step 1: Add example story page**

Create `docs/gallery/example-story.md`:

```md
---
title: Example Story
date: 2025-01-01
location: Beijing
cover: ''
photos: []
permalink: /gallery/example-story/
pageClass: photo-story-page
---

<PhotoStoryHeader />

这是一篇摄影故事页示例。这里可以写正常 Markdown。

<PhotoStoryGallery />
```

- [ ] **Step 2: Replace gallery styles**

In `docs/.vuepress/themes/styles/_gallery.scss`, keep only shared gallery page shell styles and add these blocks:

```scss
.gallery-home {
  width: min(calc(100% - 48px), 1180px);
  margin: 0 auto;
  padding: 48px 0 72px;
}

.gallery-home__intro {
  margin-bottom: 40px;
  color: var(--vp-c-text-2);
}

.gallery-story-index {
  display: grid;
  gap: 36px;
}

.gallery-story-year {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 24px;
}

.gallery-story-year h2 {
  margin: 0;
  color: var(--vp-c-text-3);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
}

.gallery-story-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 18px;
}

.gallery-story-card {
  display: grid;
  gap: 8px;
  color: inherit;
  text-decoration: none;
}

.gallery-story-card__cover {
  display: block;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
}

.gallery-story-card__cover img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity .18s ease;
}

.gallery-story-card:hover img {
  opacity: .62;
}

.gallery-story-card__title {
  color: var(--vp-c-text-1);
  font-size: 14px;
}

.gallery-story-card__meta {
  color: var(--vp-c-text-3);
  font-size: 12px;
}

.photo-story-page .vp-doc {
  width: min(calc(100% - 48px), 920px);
}

.photo-story-header {
  margin: 32px 0 40px;
}

.photo-story-header h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.photo-story-header__meta {
  display: flex;
  gap: 12px;
  margin: 8px 0 0;
  color: var(--vp-c-text-3);
  font-size: 12px;
}

.photo-story-gallery {
  display: grid;
  gap: 18px;
  margin: 40px 0;
}

.photo-story-gallery__figure {
  margin: 0;
}

.photo-story-gallery__image {
  display: block;
  width: 100%;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: zoom-in;
}

.photo-story-gallery__image img {
  display: block;
  width: 100%;
  height: auto;
}

.photo-story-gallery figcaption {
  margin-top: 8px;
  color: var(--vp-c-text-3);
  font-size: 12px;
}

.gallery-lightbox--clean {
  position: fixed;
  z-index: 120;
  inset: 0;
  background: #fff;
}

.gallery-lightbox--clean .gallery-lightbox__stage {
  position: absolute;
  inset: 0;
}

@media (max-width: 700px) {
  .gallery-home {
    width: min(calc(100% - 32px), 1180px);
    padding-top: 32px;
  }

  .gallery-story-year {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .gallery-story-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }
}
```

- [ ] **Step 3: Run build**

```bash
npm run docs:build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add docs/.vuepress/themes/styles/_gallery.scss docs/gallery/example-story.md
git commit -m "style(gallery): add photo story layouts"
```

## Task 7: Simplify Build Script Contract

**Files:**
- Modify: `scripts/gallery/build.mjs`
- Modify: `scripts/gallery/README.md`

- [ ] **Step 1: Update build script imports**

In `scripts/gallery/build.mjs`, replace `albums.config.mjs` usage with:

```js
import storiesConfig from './stories.config.mjs'
import { mergePhotos, buildStories, writeManifest } from './manifest.mjs'
```

- [ ] **Step 2: Update manifest writing**

Where the script currently computes albums and tags, replace with:

```js
const stories = buildStories(storiesConfig, merged)
await writeManifest(PUBLIC_DATA_DIR, { photos: merged, stories })
```

- [ ] **Step 3: Remove obsolete copy from README**

Update `scripts/gallery/README.md` so it says:

```md
# Gallery Scripts

The gallery is story-first. Markdown files in `docs/gallery/*.md` contain prose and frontmatter. `scripts/gallery/stories.config.mjs` defines story ordering and photo membership for the runtime index.

Run:

```bash
npm run gallery:build
```

The build writes:

- `docs/.vuepress/public/gallery/data/photos.json`
- `docs/.vuepress/public/gallery/data/stories.json`
```

- [ ] **Step 4: Run script tests**

```bash
npm run gallery:test
```

Expected: PASS after updating or deleting tests that only assert old tag/album behavior.

- [ ] **Step 5: Commit**

```bash
git add scripts/gallery/build.mjs scripts/gallery/README.md scripts/gallery/__tests__
git commit -m "refactor(gallery): simplify build output for stories"
```

## Task 8: Retire Old Gallery UI

**Files:**
- Delete: `docs/.vuepress/themes/components/gallery/PhotoInfoPanel.vue`
- Delete: `docs/.vuepress/themes/components/gallery/TabTimeline.vue`
- Delete: `docs/.vuepress/themes/components/gallery/YearTimeline.vue`
- Delete: `docs/.vuepress/themes/components/gallery/AlbumDetail.vue`
- Delete or shrink: old tests for timeline, tags, album details, EXIF panels

- [ ] **Step 1: Search for old component references**

```bash
rg -n "PhotoInfoPanel|TabTimeline|YearTimeline|AlbumDetail|gallery-simple-nav|tags|albums" docs/.vuepress scripts/gallery
```

Expected: only obsolete tests or files scheduled for deletion should match.

- [ ] **Step 2: Delete unused components**

Delete files that no longer have references:

```bash
rm docs/.vuepress/themes/components/gallery/PhotoInfoPanel.vue
rm docs/.vuepress/themes/components/gallery/TabTimeline.vue
rm docs/.vuepress/themes/components/gallery/YearTimeline.vue
rm docs/.vuepress/themes/components/gallery/AlbumDetail.vue
```

- [ ] **Step 3: Delete obsolete tests**

Delete tests that cover retired behavior:

```bash
rm docs/.vuepress/themes/__tests__/PhotoInfoPanel.test.ts
rm docs/.vuepress/themes/__tests__/TabTimeline.test.ts
rm docs/.vuepress/themes/__tests__/timelineActiveYear.test.ts
```

Keep `PhotoTile` tests only if `PhotoTile.vue` remains used. If `PhotoStoryGallery.vue` renders images directly, delete `PhotoTile.vue` and its tests too.

- [ ] **Step 4: Run full tests**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A docs/.vuepress/themes
git commit -m "refactor(gallery): remove photo archive UI"
```

## Task 9: Final Verification

**Files:**
- No code changes expected unless verification finds issues.

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 2: Build docs**

```bash
npm run docs:build
```

Expected: PASS and generated files include `/gallery/index.html` and `/gallery/example-story/index.html`.

- [ ] **Step 3: Start local server**

```bash
npm run docs:dev -- --host 127.0.0.1 --port 8080
```

Expected: VuePress dev server starts.

- [ ] **Step 4: Browser verify**

Open:

- `http://127.0.0.1:8080/gallery/`
- `http://127.0.0.1:8080/gallery/example-story/`

Check:

- `/gallery/` shows story cards grouped by year.
- Story page renders Markdown prose.
- `PhotoStoryHeader` renders title/date/location.
- `PhotoStoryGallery` renders images when frontmatter has photo ids.
- Clicking an image opens a clean full-screen viewer.
- No EXIF panel, tag filter, timeline sidebar, or album detail chrome remains.

- [ ] **Step 5: Commit any verification fixes**

```bash
git status --short
git add <fixed-files>
git commit -m "fix(gallery): address photo story verification issues"
```

## Self-Review

- Spec coverage: The plan covers story-first index, Markdown story pages, minimal photo data, clean lightbox, removal of tags/EXIF/timeline, and build/test verification.
- Placeholder scan: No task depends on unspecified future behavior; where exact deletion depends on reference search, the plan gives the exact command and decision rule.
- Type consistency: `Photo`, `PhotoSourceSet`, and `PhotoStory` names are introduced in Task 1 and used consistently later.

Plan complete and saved to `superpowers/plans/2026-05-09-photo-story-gallery-implementation.md`.

Two execution options:

1. **Subagent-Driven (recommended)** - dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** - execute tasks in this session using executing-plans, batch execution with checkpoints.
