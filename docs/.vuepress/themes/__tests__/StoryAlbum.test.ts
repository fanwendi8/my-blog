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

  it('renders photos in ids order with source-ratio frames and optional captions', () => {
    const wrapper = mount(StoryAlbum, {
      props: { ids: ['b', 'a', 'c'], captions: { b: 'Stacked sky' } },
    })
    const albumItems = wrapper.findAll('.story-album__item')

    expect(albumItems).toHaveLength(3)
    expect(wrapper.findAll('.story-album__frame')).toHaveLength(3)
    expect(wrapper.findAll('.story-album__image').map((image) => image.attributes('src')))
      .toEqual(['/gallery-img/b-thumb.webp', '/gallery-img/a-thumb.webp', '/gallery-img/c-thumb.webp'])
    expect(wrapper.findAll('.story-album__frame')[0].attributes('style'))
      .toContain('--story-photo-ratio: 400 / 600')
    expect(albumItems.every((item) => item.attributes('style') === undefined)).toBe(true)
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

  it('keeps the StoryAlbum grid rhythm compact on mobile', () => {
    const styles = readFileSync(resolve(process.cwd(), 'docs/.vuepress/themes/styles/_gallery.scss'), 'utf8')
    const mobileAlbumRule = styles.match(
      /@media\s*\(max-width:\s*719px\)[\s\S]*?\.story-album\s*\{([^}]*)\}/,
    )?.[1] ?? ''

    expect(mobileAlbumRule).toMatch(/gap:\s*22px 12px/)
    expect(mobileAlbumRule).toMatch(/max-width:\s*calc\(100vw - 32px\)/)
  })

  it('uses a graphite gallery frame with a white mat and cover-fit image', () => {
    const styles = readFileSync(resolve(process.cwd(), 'docs/.vuepress/themes/styles/_gallery.scss'), 'utf8')
    const itemRule = styles.match(/\.story-album__item\s*\{([^}]*)\}/)?.[1] ?? ''
    const frameRule = styles.match(/\.story-album__frame\s*\{([^}]*)\}/)?.[1] ?? ''
    const frameLipRule = styles.match(/\.story-album__frame::before\s*\{([^}]*)\}/)?.[1] ?? ''
    const imageRule = styles.match(/\.story-album__image\s*\{([^}]*)\}/)?.[1] ?? ''
    const hoverRule = styles.match(/\.story-album__frame:hover \.story-album__image\s*\{([^}]*)\}/)?.[1] ?? ''
    const captionRule = styles.match(/\.story-album__caption\s*\{([^}]*)\}/)?.[1] ?? ''
    const captionLineRule = styles.match(/\.story-album__caption::before\s*\{([^}]*)\}/)?.[1] ?? ''
    const albumRule = styles.match(/\.story-album\s*\{([^}]*)\}/)?.[1] ?? ''
    const backRule = styles.match(/\.story-album__back\s*\{([^}]*)\}/)?.[1] ?? ''
    const desktopAlbumRule =
      styles.match(/@media\s*\(min-width:\s*1200px\)[\s\S]*?\.story-album\s*\{([^}]*)\}/)?.[1] ?? ''
    const tabletAlbumRule =
      styles.match(/@media\s*\(min-width:\s*720px\)\s*and\s*\(max-width:\s*1199px\)[\s\S]*?\.story-album\s*\{([^}]*)\}/)?.[1] ?? ''
    const mobileFrameRule =
      styles.match(/@media\s*\(max-width:\s*719px\)[\s\S]*?\.story-album__frame\s*\{([^}]*)\}/)?.[1] ?? ''

    expect(frameRule).toMatch(/aspect-ratio:\s*var\(--story-photo-ratio, 4 \/ 3\)/)
    expect(albumRule).toMatch(/display:\s*flex/)
    expect(albumRule).toMatch(/flex-wrap:\s*wrap/)
    expect(albumRule).toMatch(/justify-content:\s*center/)
    expect(albumRule).toMatch(/max-width:\s*min\(1400px,\s*calc\(100vw - 64px\)\)/)
    expect(itemRule).toMatch(/flex:\s*0 0 auto/)
    expect(itemRule).not.toMatch(/transform:/)
    expect(frameRule).toMatch(/height:\s*var\(--story-row-height\)/)
    expect(frameRule).toMatch(/width:\s*auto/)
    expect(frameRule).toMatch(/border:\s*3px solid transparent/)
    expect(frameRule).toMatch(/--story-mat-inset:\s*clamp\(24px,\s*2vw,\s*28px\)/)
    expect(frameRule).toMatch(/padding:\s*var\(--story-mat-inset\)/)
    expect(frameRule).toMatch(/linear-gradient\(var\(--story-mat-color\),\s*var\(--story-mat-color\)\) padding-box/)
    expect(frameRule).toMatch(/linear-gradient\(140deg,\s*var\(--story-frame-color\)/)
    expect(frameRule).toMatch(/0 12px 22px rgba\(38, 36, 31, \.18\)/)
    expect(frameRule).toMatch(/border-radius:\s*0/)
    expect(frameLipRule).toMatch(/inset:\s*var\(--story-mat-inset\)/)
    expect(frameLipRule).toMatch(/border:\s*1px solid rgba\(51, 50, 46, \.18\)/)
    expect(imageRule).toMatch(/object-fit:\s*cover/)
    expect(imageRule).toMatch(/border:\s*1px solid rgba\(45, 45, 42, \.13\)/)
    expect(hoverRule).toMatch(/^\s*opacity:\s*\.9\s*;?\s*$/)
    expect(captionRule).toMatch(/font-size:\s*12px/)
    expect(captionLineRule).toMatch(/width:\s*48px/)
    expect(captionLineRule).toMatch(/height:\s*1px/)
    expect(backRule).toMatch(/flex-basis:\s*100%/)
    expect(desktopAlbumRule).toMatch(/--story-row-height:\s*220px/)
    expect(tabletAlbumRule).toMatch(/--story-row-height:\s*185px/)
    expect(mobileFrameRule).toMatch(/--story-row-height:\s*140px/)
    expect(mobileFrameRule).toMatch(/--story-mat-inset:\s*10px/)
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
