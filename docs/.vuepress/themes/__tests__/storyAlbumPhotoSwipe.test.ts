import type PhotoSwipe from 'photoswipe'
import { describe, expect, it, vi } from 'vitest'
import { configureStoryAlbumPhotoSwipe } from '../gallery/storyAlbumPhotoSwipe'

describe('configureStoryAlbumPhotoSwipe', () => {
  it('locks the thumbnail placeholder to the displayed large-image box', () => {
    const listeners = new Map<string, (event: any) => void>()
    const photoSwipe = {
      addFilter: vi.fn(),
      on: vi.fn((event: string, listener: (event: any) => void) => {
        listeners.set(event, listener)
      }),
      ui: { registerElement: vi.fn() },
    } as unknown as PhotoSwipe

    configureStoryAlbumPhotoSwipe(photoSwipe)

    const contentResize = listeners.get('contentResize')
    const placeholder = document.createElement('img')
    placeholder.style.width = '250px'
    placeholder.style.height = 'auto'
    placeholder.style.transform = 'scale(2.204)'

    expect(contentResize).toEqual(expect.any(Function))

    contentResize?.({
      content: { placeholder: { element: placeholder } },
      width: 551,
      height: 624,
    })

    expect(placeholder.style.width).toBe('551px')
    expect(placeholder.style.height).toBe('624px')
    expect(placeholder.style.transform).toBe('none')
    expect(placeholder.style.objectFit).toBe('cover')
  })

  it('registers a hidden close proxy that delegates to the story instance', () => {
    const registerElement = vi.fn()
    const on = vi.fn((event: string, listener: () => void) => {
      if (event === 'uiRegister') listener()
    })
    const photoSwipe = {
      addFilter: vi.fn(),
      on,
      ui: { registerElement },
    } as unknown as PhotoSwipe

    configureStoryAlbumPhotoSwipe(photoSwipe)

    const closeProxy = registerElement.mock.calls
      .map(([element]) => element)
      .find((element) => element.name === 'story-album-close-proxy')

    expect(closeProxy).toMatchObject({
      className: 'pswp__button pswp__button--close',
      isButton: true,
      appendTo: 'root',
    })

    const element = document.createElement('button')
    const close = vi.fn()
    closeProxy?.onInit?.(element, { close } as unknown as PhotoSwipe)

    expect(element.hidden).toBe(true)
    expect(element.getAttribute('aria-hidden')).toBe('true')
    expect(element.tabIndex).toBe(-1)

    element.click()

    expect(close).toHaveBeenCalledOnce()
  })
})
