// docs/.vuepress/themes/components/gallery/types.ts
export interface Photo {
  id: string
  src: { thumb: string; preview?: string; large: string }
  w: number
  h: number
  blurhash: string
  title?: string | null
  desc?: string | null
  takenAt: string
  exif?: {
    camera?: string | null
    lens?: string | null
    fl?: number | null
    fn?: number | null
    iso?: number | null
    exp?: string | null
  } | null
  gps?: { lat: number; lon: number } | null
  albums: string[]
  tags: string[]
}

export interface Album {
  id: string
  title: string
  desc: string
  cover: string | null
  count: number
  createdAt: string | null
}

export interface Tag { name: string; count: number }

export type GalleryTab = 'timeline' | 'albums'

export interface GalleryRoute {
  tab: GalleryTab
  p?: string                            // active photo id
  album?: string
  tag?: string
  tags?: string[]
}
