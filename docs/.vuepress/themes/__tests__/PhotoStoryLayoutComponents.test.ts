import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import StoryPhoto from '../components/gallery/StoryPhoto.vue'
import StoryPhotos from '../components/gallery/StoryPhotos.vue'
import StorySplit from '../components/gallery/StorySplit.vue'

vi.mock('../composables/useGalleryData', () => ({
  useGalleryData: () => ({
    photos: ref([
      { id: 'a', src: '/a.webp', w: 600, h: 400, alt: 'A', caption: 'Alpha' },
      { id: 'b', src: { large: { avif: 'b/large.avif', w: 2560 } }, w: 400, h: 600, alt: 'B' },
      { id: 'c', src: '/c.webp', w: 700, h: 700, title: 'C' },
    ]),
    stories: ref([]),
    ready: ref(true),
    error: ref(null),
    reload: vi.fn(),
  }),
}))

describe('photo story layout components', () => {
  it('renders a single story photo by id', () => {
    const wrapper = mount(StoryPhoto, { props: { id: 'a' } })

    const image = wrapper.get('img.photo-story-gallery__image')
    expect(image.attributes('src')).toBe('/a.webp')
    expect(image.attributes('alt')).toBe('A')
    expect(wrapper.get('figcaption').text()).toBe('Alpha')
  })

  it('renders a row of story photos in the requested order', () => {
    const wrapper = mount(StoryPhotos, { props: { ids: ['b', 'a'] } })

    expect(wrapper.classes()).toContain('photo-story-photos')
    expect(wrapper.findAll('img').map((image) => image.attributes('src'))).toEqual([
      '/gallery-img/b/large.avif',
      '/a.webp',
    ])
  })

  it('renders a left-photo and right-stack split', () => {
    const wrapper = mount(StorySplit, { props: { left: ['a'], right: ['b', 'c'] } })

    expect(wrapper.classes()).toContain('photo-story-split')
    expect(wrapper.find('.photo-story-split__primary img').attributes('src')).toBe('/a.webp')
    expect(wrapper.findAll('.photo-story-split__secondary img')).toHaveLength(2)
  })

  it('renders split groups in both horizontal directions', () => {
    const wrapper = mount(StorySplit, {
      props: {
        left: ['a', 'b'],
        right: ['c'],
        reverse: true,
      },
    })

    expect(wrapper.classes()).toContain('photo-story-split')
    expect(wrapper.classes()).toContain('photo-story-split--reverse')
    expect(wrapper.findAll('.photo-story-split__primary img')).toHaveLength(1)
    expect(wrapper.findAll('.photo-story-split__secondary img')).toHaveLength(2)
  })
})
