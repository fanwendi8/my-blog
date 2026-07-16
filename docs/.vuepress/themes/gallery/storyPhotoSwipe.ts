import type { SlideData } from 'photoswipe'
import { largeSrc, thumbSrc } from './photoSources'
import type { Photo } from './types'

export interface StoryCaptionMap {
  [photoId: string]: string | undefined
}

export function createStoryPhotoSwipeItems(
  photos: Photo[],
  ids: string[],
  captions?: StoryCaptionMap,
): SlideData[] {
  const photosById = new Map(photos.map((photo) => [photo.id, photo]))

  return ids.flatMap((id) => {
    const photo = photosById.get(id)
    if (!photo) return []

    const caption = captions?.[id] ?? photo.caption ?? undefined
    return [{
      type: 'image' as const,
      src: largeSrc(photo),
      msrc: thumbSrc(photo),
      width: photo.w,
      height: photo.h,
      alt: photo.alt,
      ...(caption !== undefined ? { caption } : {}),
    }]
  })
}
