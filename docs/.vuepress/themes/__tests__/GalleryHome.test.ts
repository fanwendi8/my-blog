// docs/.vuepress/themes/__tests__/GalleryHome.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import GalleryHome from '../layouts/GalleryHome.vue'
import type { Photo, Tag } from '../components/gallery/types'

const photos: Photo[] = [
  { id: 'a', src: { thumb: 'a/thumb.webp', large: 'a/large.webp' }, w: 600, h: 400, blurhash: 'L', albums: [], tags: ['street'], takenAt: '2025-01-01T00:00:00Z' },
  { id: 'b', src: { thumb: 'b/thumb.webp', large: 'b/large.webp' }, w: 600, h: 400, blurhash: 'L', albums: [], tags: ['film'], takenAt: '2025-01-02T00:00:00Z' },
]

const tags: Tag[] = [{ name: 'street', count: 1 }, { name: 'film', count: 1 }]

vi.mock('vuepress/client', () => ({
  ClientOnly: defineComponent({
    setup(_, { slots }) {
      return () => slots.default?.()
    },
  }),
}))

vi.mock('../composables/useGalleryData', () => ({
  useGalleryData: () => ({
    photos: ref(photos),
    albums: ref([]),
    tags: ref(tags),
    ready: ref(true),
    error: ref(null),
    reload: vi.fn(),
  }),
}))

vi.mock('../composables/useGalleryRoute', () => ({
  useGalleryRoute: () => ({
    route: ref({ tab: 'timeline' }),
    push: vi.fn(),
    pull: vi.fn(),
  }),
}))

vi.mock('../components/gallery/TabTimeline.vue', () => ({
  default: defineComponent({
    setup() {
      return () => h('section', { class: 'tab-timeline-stub' })
    },
  }),
}))

vi.mock('../components/gallery/TabAlbums.vue', () => ({
  default: defineComponent({
    setup() {
      return () => h('section', { class: 'tab-albums-stub' })
    },
  }),
}))

vi.mock('../components/gallery/AlbumDetail.vue', () => ({
  default: defineComponent({
    setup() {
      return () => h('section', { class: 'album-detail-stub' })
    },
  }),
}))

vi.mock('../components/gallery/Lightbox.vue', () => ({
  default: defineComponent({
    setup() {
      return () => null
    },
  }),
}))

vi.mock('../components/gallery/JustifiedGrid.vue', () => ({
  default: defineComponent({
    setup() {
      return () => h('div', { class: 'justified-grid-stub' })
    },
  }),
}))

describe('GalleryHome', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    document.documentElement.style.scrollBehavior = ''
    document.body.style.scrollBehavior = ''
  })

  it('scrolls instantly to the top when switching main tabs', async () => {
    document.documentElement.style.scrollBehavior = 'smooth'
    document.body.style.scrollBehavior = 'smooth'
    const scrollTo = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: scrollTo,
    })
    const wrapper = mount(GalleryHome)

    await wrapper.findAll('.gallery-tab')[2].trigger('click')
    await flushPromises()

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' })
    expect(wrapper.find('.gallery-home__viewport').element.scrollTop).toBe(0)
  })

  it('scrolls to the top when changing the active tag', async () => {
    const scrollTo = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: scrollTo,
    })
    const wrapper = mount(GalleryHome)

    await wrapper.findAll('.gallery-tab')[2].trigger('click')
    await flushPromises()
    scrollTo.mockClear()

    await wrapper.findAll('.gallery-chip')[1].trigger('click')
    await flushPromises()

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' })
  })
})
