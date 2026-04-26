// docs/.vuepress/themes/composables/useFiltering.ts
import type { Photo } from '../components/gallery/types'

export interface PhotoFilter {
  album?: string
  tag?: string
}

export function filterPhotos(photos: Photo[], filter: PhotoFilter): Photo[] {
  return photos.filter((p) => {
    if (filter.album && !p.albums.includes(filter.album)) return false
    if (filter.tag && !p.tags.includes(filter.tag)) return false
    return true
  })
}
