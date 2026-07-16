import type { PhotoSwipeOptions } from 'photoswipe'

export const galleryPhotoSwipeOptions: PhotoSwipeOptions = {
  allowPanToNext: false,
  arrowKeys: true,
  bgClickAction: 'close',
  bgOpacity: 1,
  doubleTapAction: false,
  imageClickAction: 'close',
  loop: false,
  padding: {
    top: 48,
    right: 48,
    bottom: 48,
    left: 48,
  },
  tapAction: 'close',
}
