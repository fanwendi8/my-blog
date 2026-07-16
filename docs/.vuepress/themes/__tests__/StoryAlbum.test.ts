import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import StoryAlbum from '../components/gallery/StoryAlbum.vue'

const photoSwipe = vi.hoisted(() => ({
  construct: vi.fn(),
  init: vi.fn(),
}))

vi.mock('photoswipe', () => ({
  default: class PhotoSwipe {
    constructor(options: unknown) {
      photoSwipe.construct(options)
    }

    init() {
      photoSwipe.init()
    }
  },
}))

vi.mock('vue-router', () => ({
  RouterLink: defineComponent({
    props: ['to'],
    setup(props, { slots }) {
      return () => h('a', { href: props.to }, slots.default?.())
    },
  }),
}))

vi.mock('../composables/useGalleryData', () => ({
  useGalleryData: () => ({
    photos: ref([
      {
        id: 'a',
        src: {
          thumb: { webp: 'a-thumb.webp' },
          large: { avif: 'a-large.avif' },
        },
        w: 600,
        h: 400,
        alt: 'A',
      },
      {
        id: 'b',
        src: {
          thumb: { webp: 'b-thumb.webp' },
          large: { avif: 'b-large.avif' },
        },
        w: 400,
        h: 600,
        alt: 'B',
      },
      {
        id: 'c',
        src: {
          thumb: { webp: 'c-thumb.webp' },
          large: { avif: 'c-large.avif' },
        },
        w: 800,
        h: 600,
        alt: 'C',
      },
    ]),
    stories: ref([]),
    ready: ref(true),
    error: ref(null),
    reload: vi.fn(),
  }),
}))

describe('StoryAlbum', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders photos in ids order with 4:3 frames and optional captions', () => {
    const wrapper = mount(StoryAlbum, {
      props: { ids: ['b', 'a', 'missing'], captions: { b: 'Stacked sky' } },
    })

    expect(wrapper.findAll('.story-album__item')).toHaveLength(2)
    expect(wrapper.findAll('.story-album__frame')).toHaveLength(2)
    expect(wrapper.findAll('.story-album__image').map((image) => image.attributes('src')))
      .toEqual(['/gallery-img/b-thumb.webp', '/gallery-img/a-thumb.webp'])
    expect(wrapper.find('.story-album__caption').text()).toBe('Stacked sky')
    expect(wrapper.find('.story-album__back').attributes('href')).toBe('/gallery/')
  })

  it('opens an ordered story lightbox at the clicked item', async () => {
    const wrapper = mount(StoryAlbum, {
      props: { ids: ['b', 'missing', 'a'], captions: { b: 'Stacked sky' } },
    })

    await wrapper.findAll('.story-album__frame')[0].trigger('click')
    await vi.dynamicImportSettled()

    expect(photoSwipe.construct).toHaveBeenCalledWith(expect.objectContaining({
      dataSource: [
        expect.objectContaining({
          src: '/gallery-img/b-large.avif',
          msrc: '/gallery-img/b-thumb.webp',
          caption: 'Stacked sky',
        }),
        expect.objectContaining({
          src: '/gallery-img/a-large.avif',
          msrc: '/gallery-img/a-thumb.webp',
        }),
      ],
      index: 0,
    }))
    expect(photoSwipe.init).toHaveBeenCalledOnce()
  })

  it('preserves native modified-click behavior on album links', async () => {
    const wrapper = mount(StoryAlbum, {
      attachTo: document.body,
      props: { ids: ['b'] },
    })
    let componentPreventedDefault: boolean | undefined
    const stopNavigation = (clickEvent: MouseEvent) => {
      componentPreventedDefault = clickEvent.defaultPrevented
      clickEvent.preventDefault()
    }
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      metaKey: true,
    })

    document.addEventListener('click', stopNavigation)
    wrapper.find('.story-album__frame').element.dispatchEvent(event)
    document.removeEventListener('click', stopNavigation)
    await wrapper.vm.$nextTick()

    expect(componentPreventedDefault).toBe(false)
    expect(photoSwipe.construct).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
