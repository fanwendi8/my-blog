import { describe, expect, it } from 'vitest'
import { galleryPhotoSwipeOptions } from '../gallery/photoSwipeOptions'

describe('galleryPhotoSwipeOptions', () => {
  it('turns story lightbox clicks into close actions instead of zooming', () => {
    expect(galleryPhotoSwipeOptions.imageClickAction).toBe('close')
    expect(galleryPhotoSwipeOptions.tapAction).toBe('close')
    expect(galleryPhotoSwipeOptions.doubleTapAction).toBe(false)
  })

  it('disables image-to-image navigation affordances', () => {
    expect(galleryPhotoSwipeOptions.loop).toBe(false)
    expect(galleryPhotoSwipeOptions.arrowKeys).toBe(false)
    expect(galleryPhotoSwipeOptions.allowPanToNext).toBe(false)
  })

  it('uses an opaque background and keeps vertical breathing room', () => {
    expect(galleryPhotoSwipeOptions.bgOpacity).toBe(1)
    expect(galleryPhotoSwipeOptions.padding).toMatchObject({
      top: 48,
      bottom: 48,
    })
  })
})
