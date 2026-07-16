import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { galleryPhotoSwipeOptions } from '../gallery/photoSwipeOptions'
import { storyAlbumPhotoSwipeOptions } from '../gallery/storyAlbumPhotoSwipe'

function expectScopedStyle(styles: string, selector: string, declaration: RegExp): void {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  expect(styles).toMatch(new RegExp(`${escapedSelector}(?=\\s*(?:,|\\{))[^{}]*\\{[^{}]*${declaration.source}`))
}

describe('galleryPhotoSwipeOptions', () => {
  it('keeps the existing global image click behavior', () => {
    expect(galleryPhotoSwipeOptions.imageClickAction).toBe('close')
    expect(galleryPhotoSwipeOptions.tapAction).toBe('close')
    expect(galleryPhotoSwipeOptions.doubleTapAction).toBe(false)
  })

  it('keeps global navigation controls disabled', () => {
    expect(galleryPhotoSwipeOptions.loop).toBe(false)
    expect(galleryPhotoSwipeOptions.arrowKeys).toBe(false)
    expect(galleryPhotoSwipeOptions.allowPanToNext).toBe(false)
  })

  it('keeps story navigation, keyboard, swipe, and close behavior explicit', () => {
    expect(storyAlbumPhotoSwipeOptions.close).toBe(false)
    expect(storyAlbumPhotoSwipeOptions.arrowPrev).toBe(true)
    expect(storyAlbumPhotoSwipeOptions.arrowNext).toBe(true)
    expect(storyAlbumPhotoSwipeOptions.counter).toBe(true)
    expect(storyAlbumPhotoSwipeOptions.loop).toBe(false)
    expect(storyAlbumPhotoSwipeOptions.bgClickAction).toBe('close')
    expect(storyAlbumPhotoSwipeOptions.escKey).toBe(true)
    expect(storyAlbumPhotoSwipeOptions.closeOnVerticalDrag).toBe(true)
    expect(storyAlbumPhotoSwipeOptions.arrowKeys).toBe(true)
    expect(storyAlbumPhotoSwipeOptions.allowPanToNext).toBe(true)
    expect(storyAlbumPhotoSwipeOptions.mainClass).toBe('story-album-lightbox')
  })

  it('keeps the original narrower horizontal global padding', () => {
    expect(galleryPhotoSwipeOptions.bgOpacity).toBe(1)
    expect(galleryPhotoSwipeOptions.padding).toEqual({
      top: 48,
      right: 24,
      bottom: 48,
      left: 24,
    })
  })

  it('scopes album-only PhotoSwipe controls to the StoryAlbum main class', () => {
    const styles = readFileSync(resolve(process.cwd(), 'docs/.vuepress/themes/styles/_gallery.scss'), 'utf8')

    for (const selector of [
      'html:has(.photo-story-page) .vp-nav',
      'html:has(.photo-story-page) .vp-navbar-title',
      'html:has(.photo-story-page) .vp-navbar-menu',
      'html:has(.photo-story-page) .vp-navbar-hamburger',
      'html:has(.photo-story-page) .vp-nav-screen',
    ]) {
      expectScopedStyle(styles, selector, /display:\s*none/)
    }
    expectScopedStyle(styles, 'html:has(.photo-story-page)', /--vp-layout-top-height:\s*0px/)

    expectScopedStyle(styles, '.pswp.story-album-lightbox .pswp__button--arrow', /width:\s*36px/)
    expectScopedStyle(styles, '.pswp.story-album-lightbox .pswp__button--arrow', /height:\s*36px/)
    expectScopedStyle(styles, '.pswp.story-album-lightbox .pswp__button--arrow', /opacity:\s*\.55/)
    expectScopedStyle(styles, '.pswp.story-album-lightbox .pswp__button--arrow--prev', /left:\s*8px/)
    expectScopedStyle(styles, '.pswp.story-album-lightbox .pswp__button--arrow--next', /right:\s*8px/)
    expectScopedStyle(styles, '.pswp.story-album-lightbox .pswp__button--arrow .pswp__icn', /width:\s*20px/)
    expectScopedStyle(styles, '.pswp.story-album-lightbox .pswp__button--arrow .pswp__icn', /height:\s*20px/)
    expectScopedStyle(styles, '.pswp.story-album-lightbox .pswp__button--arrow:hover', /opacity:\s*\.9/)
    expectScopedStyle(styles, '.pswp.story-album-lightbox .pswp__button--arrow:focus-visible', /opacity:\s*\.9/)
    expect(styles).not.toContain('.pswp .pswp__button--arrow--prev')
  })
})
