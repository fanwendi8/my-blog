import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import GalleryHome from '../layouts/GalleryHome.vue'

vi.mock('vuepress/client', () => ({
  ClientOnly: defineComponent({
    setup(_, { slots }) {
      return () => slots.default?.()
    },
  }),
}))

vi.mock('vue-router', () => ({
  RouterLink: defineComponent({
    props: ['to'],
    setup(props, { slots }) {
      return () => h('a', { class: 'router-link-stub', href: props.to }, slots.default?.())
    },
  }),
}))

vi.mock('../composables/useGalleryData', () => ({
  useGalleryData: () => ({
    photos: ref([
      { id: 'a', src: '/a.webp', w: 600, h: 400, alt: 'A' },
      {
        id: 'b',
        src: { thumb: { webp: 'b-thumb.webp', w: 480 }, large: { avif: 'b-large.avif', w: 2560 } },
        w: 600,
        h: 400,
        alt: 'B',
      },
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
    const wrapper = mount(GalleryHome)

    expect(wrapper.find('.gallery-story-index').exists()).toBe(true)
    expect(wrapper.text()).toContain('2025')
    expect(wrapper.text()).toContain('2024')
    expect(wrapper.findAll('.gallery-story-card')).toHaveLength(2)
    expect(wrapper.find('.router-link-stub').attributes('href')).toBe('/gallery/late/')
  })

  it('resolves object photo sources without placeholder styling for story covers', () => {
    const wrapper = mount(GalleryHome)

    const images = wrapper.findAll('.gallery-story-card__cover img')
    expect(images[1].attributes('src')).toBe('/gallery-img/b-thumb.webp')
    expect(images[1].attributes('style')).toBeUndefined()
  })
})
