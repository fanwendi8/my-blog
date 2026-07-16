import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { galleryPhotoSwipeOptions } from '../gallery/photoSwipeOptions'
import { storyAlbumPhotoSwipeOptions } from '../gallery/storyAlbumPhotoSwipe'

function expectScopedStyle(styles: string, selector: string, declaration: RegExp): void {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  expect(styles).toMatch(new RegExp(`${escapedSelector}(?=\\s*(?:,|\\{))[^{}]*\\{[^{}]*${declaration.source}`))
}

function expectNoUnscopedStoryNavigationStyles(styles: string): void {
  const unscopedNavbarRules: string[] = []
  const unscopedHeightRules: string[] = []
  const cssWithoutComments = styles.replace(/\/\*[\s\S]*?\*\//g, '')

  for (const [, rawSelector, declarations] of cssWithoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = rawSelector
      .split(',')
      .map(selector => selector.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
    const isStoryScoped = (selector: string): boolean =>
      /^(?:html:has\(\s*\.photo-story-page\s*\)|\.photo-story-page)(?:\s|[>+~]|$)/.test(selector)
    const hasNavbarTarget = (selector: string): boolean =>
      /(?:^|[\s>+~])\.(?:vp-nav|vp-navbar-title|vp-navbar-menu|vp-navbar-hamburger|vp-nav-screen)(?=$|[\s.#:[>+~])/.test(selector)
    const hasHeightReset = /(?:^|;)\s*--vp-(?:layout-top-height|nav-height)\s*:\s*0(?:px)?\b/.test(declarations)
    const hasDisplayNone = /(?:^|;)\s*display\s*:\s*none\b/.test(declarations)

    if (hasDisplayNone) {
      unscopedNavbarRules.push(
        ...selectors.filter(selector => hasNavbarTarget(selector) && !isStoryScoped(selector)),
      )
    }
    if (hasHeightReset) {
      unscopedHeightRules.push(
        ...selectors.filter(selector => !isStoryScoped(selector)),
      )
    }
  }

  expect(unscopedNavbarRules).toEqual([])
  expect(unscopedHeightRules).toEqual([])
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

    expect(storyAlbumPhotoSwipeOptions.padding).toEqual({
      top: 48,
      right: expect.any(Number),
      bottom: 48,
      left: expect.any(Number),
    })
    const padding = storyAlbumPhotoSwipeOptions.padding
    if (!padding) throw new Error('Story album padding must be configured')
    expect(padding.left).toBeGreaterThanOrEqual(44)
    expect(padding.right).toBeGreaterThanOrEqual(44)
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
    expectScopedStyle(styles, 'html:has(.photo-story-page)', /--vp-nav-height:\s*0px/)

    expectScopedStyle(styles, '.pswp.story-album-lightbox .pswp__button--arrow', /width:\s*36px/)
    expectScopedStyle(styles, '.pswp.story-album-lightbox .pswp__button--arrow', /height:\s*36px/)
    expectScopedStyle(styles, '.pswp.story-album-lightbox .pswp__button--arrow', /opacity:\s*\.55/)
    expectScopedStyle(styles, '.pswp.story-album-lightbox .pswp__button--arrow--prev', /left:\s*8px/)
    expectScopedStyle(styles, '.pswp.story-album-lightbox .pswp__button--arrow--next', /right:\s*8px/)
    expectScopedStyle(styles, '.pswp.story-album-lightbox .pswp__button--arrow .pswp__icn', /width:\s*20px/)
    expectScopedStyle(styles, '.pswp.story-album-lightbox .pswp__button--arrow .pswp__icn', /height:\s*20px/)
    expectScopedStyle(styles, '.pswp.story-album-lightbox .pswp__button--arrow:hover', /opacity:\s*\.9/)
    expectScopedStyle(styles, '.pswp.story-album-lightbox .pswp__button--arrow:focus-visible', /opacity:\s*\.9/)
    expectScopedStyle(styles, '.pswp.story-album-lightbox .pswp__counter', /display:\s*block/)
    expect(styles).not.toContain('.pswp .pswp__button--arrow--prev')
  })

  it('rejects unscoped story navigation hiding and height resets', () => {
    const styles = readFileSync(resolve(process.cwd(), 'docs/.vuepress/themes/styles/_gallery.scss'), 'utf8')

    expectNoUnscopedStoryNavigationStyles(styles)
  })
})
