import type { PhotoSwipeOptions } from 'photoswipe'

export const galleryPhotoSwipeOptions: PhotoSwipeOptions = {
  allowPanToNext: false,
  arrowKeys: false,
  bgClickAction: 'close',
  bgOpacity: 1,
  doubleTapAction: false,
  imageClickAction: 'close',
  loop: false,
  padding: {
    top: 48,
    right: 24,
    bottom: 48,
    left: 24,
  },
  tapAction: 'close',
}
