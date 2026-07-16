import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { galleryPhotoSwipeOptions } from '../gallery/photoSwipeOptions'
import { storyAlbumPhotoSwipeOptions } from '../gallery/storyAlbumPhotoSwipe'

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

  it('keeps story navigation controls enabled without a close button', () => {
    expect(storyAlbumPhotoSwipeOptions.close).toBe(false)
    expect(storyAlbumPhotoSwipeOptions.arrowPrev).toBe(true)
    expect(storyAlbumPhotoSwipeOptions.arrowNext).toBe(true)
    expect(storyAlbumPhotoSwipeOptions.counter).toBe(true)
    expect(storyAlbumPhotoSwipeOptions.loop).toBe(false)
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

    expect(styles).toContain('html:has(.photo-story-page) .vp-nav')
    expect(styles).toContain('html:has(.photo-story-page) .vp-nav-screen')
    expect(styles).toContain('html:has(.photo-story-page) .vp-navbar-hamburger')
    expect(styles).toContain('--vp-layout-top-height: 0px')
    expect(styles).toContain('.pswp.story-album-lightbox .pswp__button--arrow')
    expect(styles).toContain('.pswp.story-album-lightbox .story-album-lightbox__caption')
    expect(styles).not.toContain('.pswp .pswp__button--arrow--prev')
  })
})
