import { describe, expect, it } from 'vitest'
import { galleryPhotoSwipeOptions } from '../gallery/photoSwipeOptions'

describe('galleryPhotoSwipeOptions', () => {
  it('turns story lightbox clicks into close actions instead of zooming', () => {
    expect(galleryPhotoSwipeOptions.imageClickAction).toBe('close')
    expect(galleryPhotoSwipeOptions.tapAction).toBe('close')
    expect(galleryPhotoSwipeOptions.doubleTapAction).toBe(false)
  })

  // Visual controls are verified in the browser; this test locks the shared navigation contract.
  it('supports arrow-key navigation without looping past album boundaries', () => {
    expect(galleryPhotoSwipeOptions.loop).toBe(false)
    expect(galleryPhotoSwipeOptions.arrowKeys).toBe(true)
    expect(galleryPhotoSwipeOptions.allowPanToNext).toBe(false)
  })

  it('uses an opaque background and keeps 48px breathing room on each edge', () => {
    expect(galleryPhotoSwipeOptions.bgOpacity).toBe(1)
    expect(galleryPhotoSwipeOptions.padding).toEqual({
      top: 48,
      right: 48,
      bottom: 48,
      left: 48,
    })
  })
})
