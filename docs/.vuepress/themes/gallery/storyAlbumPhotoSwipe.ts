import type { PhotoSwipeOptions } from 'photoswipe'
import type PhotoSwipe from 'photoswipe'
import { galleryPhotoSwipeOptions } from './photoSwipeOptions'

export const storyAlbumPhotoSwipeOptions: PhotoSwipeOptions = {
  ...galleryPhotoSwipeOptions,
  allowPanToNext: true,
  arrowNext: true,
  arrowPrev: true,
  arrowKeys: true,
  close: false,
  closeOnVerticalDrag: true,
  counter: true,
  escKey: true,
  mainClass: 'story-album-lightbox',
  padding: {
    top: 48,
    right: 48,
    bottom: 48,
    left: 48,
  },
  pinchToClose: false,
  wheelToZoom: false,
  zoom: false,
}

export function configureStoryAlbumPhotoSwipe(photoSwipe: PhotoSwipe): void {
  photoSwipe.addFilter('isContentZoomable', () => false)
  photoSwipe.on('uiRegister', () => {
    photoSwipe.ui.registerElement({
      name: 'story-album-caption',
      className: 'story-album-lightbox__caption',
      appendTo: 'root',
      onInit(element, instance) {
        const updateCaption = () => {
          const caption = (instance.currSlide?.data as { caption?: unknown } | undefined)?.caption
          const visible = typeof caption === 'string' && caption.trim().length > 0

          element.textContent = visible ? caption : ''
          element.hidden = !visible
        }

        instance.on('change', updateCaption)
        updateCaption()
      },
    })
    photoSwipe.ui.registerElement({
      name: 'story-album-close-proxy',
      className: 'pswp__button pswp__button--close',
      isButton: true,
      appendTo: 'root',
      onInit(element, instance) {
        element.hidden = true
        element.setAttribute('aria-hidden', 'true')
        element.tabIndex = -1
        element.addEventListener('click', () => instance.close())
      },
    })
  })
}
