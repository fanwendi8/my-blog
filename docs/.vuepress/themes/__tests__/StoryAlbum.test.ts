import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import StoryAlbum from '../components/gallery/StoryAlbum.vue'

const photoSwipe = vi.hoisted(() => ({
  addFilter: vi.fn(),
  construct: vi.fn(),
  init: vi.fn(),
  on: vi.fn(),
  registerElement: vi.fn(),
}))

vi.mock('photoswipe', () => ({
  default: class PhotoSwipe {
    addFilter = photoSwipe.addFilter
    on = photoSwipe.on
    ui = { registerElement: photoSwipe.registerElement }

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
      {
        id: 'empty',
        src: {
          thumb: { webp: 'empty-thumb.webp' },
          large: { avif: 'empty-large.avif' },
        },
        w: 800,
        h: 600,
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
    photoSwipe.on.mockReset()
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

  it('renders an icon-only back link with an accessible name and tooltip', () => {
    const wrapper = mount(StoryAlbum, { props: { ids: ['b'] } })
    const back = wrapper.get('.story-album__back')
    const styles = readFileSync(resolve(process.cwd(), 'docs/.vuepress/themes/styles/_gallery.scss'), 'utf8')
    const backRule = styles.match(/\.story-album__back\s*\{[^}]*\}/)?.[0] ?? ''

    expect(back.attributes('aria-label')).toBe('返回瞳画')
    expect(back.attributes('title')).toBe('返回瞳画')
    expect(back.text()).toBe('')
    expect(back.find('svg').exists()).toBe(true)
    const path = back.get('path')
    expect(path.attributes('d')).toBe('M11.5 4.5 6 10l5.5 5.5')
    expect(path.attributes('fill')).toBe('none')
    expect(path.attributes('stroke')).toBe('currentColor')
    expect(path.attributes('stroke-width')).toBe('1')
    expect(backRule).toMatch(/min-width:\s*32px/)
    expect(backRule).toMatch(/min-height:\s*32px/)
    expect(backRule).toMatch(/display:\s*inline-flex/)
    expect(backRule).toMatch(/justify-self:\s*center/)
  })

  it('keeps the StoryAlbum grid gap at 20px on mobile', () => {
    const styles = readFileSync(resolve(process.cwd(), 'docs/.vuepress/themes/styles/_gallery.scss'), 'utf8')
    const mobileAlbumRule = styles.match(
      /@media\s*\(max-width:\s*719px\)[\s\S]*?\.story-album\s*\{([^}]*)\}/,
    )?.[1] ?? ''

    expect(mobileAlbumRule).toMatch(/gap:\s*20px/)
    expect(mobileAlbumRule).not.toMatch(/gap:\s*12px/)
  })

  it('uses a white 6px mat with four subtle corner marks instead of a continuous frame', () => {
    const styles = readFileSync(resolve(process.cwd(), 'docs/.vuepress/themes/styles/_gallery.scss'), 'utf8')
    const frameRule = styles.match(/\.story-album__frame\s*\{([^}]*)\}/)?.[1] ?? ''
    const imageRule = styles.match(/\.story-album__image\s*\{([^}]*)\}/)?.[1] ?? ''
    const hoverRule = styles.match(/\.story-album__frame:hover \.story-album__image\s*\{([^}]*)\}/)?.[1] ?? ''
    const cornerLines = frameRule.match(/linear-gradient\(#cfcfcf 0 0\)/g) ?? []

    expect(frameRule).toMatch(/aspect-ratio:\s*4\s*\/\s*3/)
    expect(frameRule).toMatch(/padding:\s*6px/)
    expect(frameRule).toMatch(/background-color:\s*#fff/)
    expect(cornerLines).toHaveLength(8)
    expect(frameRule).toMatch(/background-size:[\s\S]*?var\(--story-frame-corner-length\)\s+1px/)
    expect(frameRule).not.toMatch(/\bborder\s*:/)
    expect(frameRule).not.toMatch(/border-radius|box-shadow/)
    expect(imageRule).toMatch(/object-fit:\s*contain/)
    expect(hoverRule).toMatch(/^\s*opacity:\s*\.64\s*;?\s*$/)
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
      mainClass: 'story-album-lightbox',
      close: false,
      arrowPrev: true,
      arrowNext: true,
      counter: true,
      loop: false,
      zoom: false,
      pinchToClose: false,
      wheelToZoom: false,
    }))
    expect(photoSwipe.addFilter).toHaveBeenCalledWith('isContentZoomable', expect.any(Function))
    expect(photoSwipe.addFilter.mock.calls[0][1](true)).toBe(false)
    expect(photoSwipe.init).toHaveBeenCalledOnce()
  })

  it('registers a visible lightbox caption from the active story slide', async () => {
    let uiRegister: (() => void) | undefined
    let onChange: (() => void) | undefined
    photoSwipe.on.mockImplementation((event: string, handler: () => void) => {
      if (event === 'uiRegister') uiRegister = handler
      if (event === 'change') onChange = handler
    })
    const wrapper = mount(StoryAlbum, {
      props: { ids: ['b'], captions: { b: 'Stacked sky' } },
    })

    await wrapper.find('.story-album__frame').trigger('click')
    await vi.dynamicImportSettled()

    expect(uiRegister).toEqual(expect.any(Function))
    uiRegister?.()
    expect(photoSwipe.registerElement).toHaveBeenCalledWith(expect.objectContaining({
      name: 'story-album-caption',
      className: 'story-album-lightbox__caption',
      appendTo: 'root',
      onInit: expect.any(Function),
    }))
    const options = photoSwipe.registerElement.mock.calls[0][0]
    const element = document.createElement('div')
    const instance = {
      currSlide: { data: { caption: 'Stacked sky' } },
      on: photoSwipe.on,
    }

    options.onInit(element, instance)
    expect(element.textContent).toBe('Stacked sky')
    expect(element.hidden).toBe(false)

    instance.currSlide.data.caption = undefined
    onChange?.()
    expect(element.textContent).toBe('')
    expect(element.hidden).toBe(true)
  })

  it('gives every album frame an accessible name when metadata is empty', () => {
    const wrapper = mount(StoryAlbum, { props: { ids: ['empty'] } })

    expect(wrapper.findAll('.story-album__frame').map((frame) => frame.attributes('aria-label')))
      .toEqual(['查看照片 1'])
  })

  it('associates a provided caption with its frame accessible name', () => {
    const wrapper = mount(StoryAlbum, {
      props: { ids: ['b'], captions: { b: 'Stacked sky' } },
    })

    const frame = wrapper.get('.story-album__frame')
    const caption = wrapper.get('.story-album__caption')
    expect(frame.attributes('aria-describedby')).toBe(caption.attributes('id'))
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
