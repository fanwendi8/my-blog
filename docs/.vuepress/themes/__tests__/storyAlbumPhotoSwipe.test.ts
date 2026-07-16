import type PhotoSwipe from 'photoswipe'
import { describe, expect, it, vi } from 'vitest'
import { configureStoryAlbumPhotoSwipe } from '../gallery/storyAlbumPhotoSwipe'

describe('configureStoryAlbumPhotoSwipe', () => {
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
