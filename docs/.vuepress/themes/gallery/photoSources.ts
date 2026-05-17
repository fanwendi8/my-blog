import type { Photo, PhotoSourceVariant } from './types'
import { publicSrc } from './cdn'

export interface ImageSourceContext {
  viewportWidth?: number
  devicePixelRatio?: number
}

function assetSrc(key: string): string {
  if (key.startsWith('/') || /^https?:\/\//.test(key)) return key
  return publicSrc(key)
}

function sourcePath(source: string | PhotoSourceVariant | undefined, preferred: 'webp' | 'avif' = 'webp'): string {
  if (!source) return ''
  if (typeof source === 'string') return source
  return source[preferred] ?? source.webp ?? source.avif ?? ''
}

export function thumbSrc(photo: Photo): string {
  if (typeof photo.src === 'string') return assetSrc(photo.src)
  return assetSrc(sourcePath(photo.src.thumb ?? photo.src.large))
}

export function largeSrc(photo: Photo, context: ImageSourceContext = {}): string {
  if (typeof photo.src === 'string') return assetSrc(photo.src)
  return assetSrc(sourcePath(photo.src.large, 'avif'))
}
