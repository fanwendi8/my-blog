export interface Photo {
  id: string
  src: string | PhotoSourceSet
  w: number
  h: number
  alt?: string
  title?: string | null
  caption?: string | null
}

export interface PhotoSourceSet {
  thumb?: string | PhotoSourceVariant
  preview?: string | PhotoSourceVariant
  large: string | PhotoSourceVariant
  xlarge?: string | PhotoSourceVariant
}

export interface PhotoSourceVariant {
  webp?: string
  avif?: string
  w?: number
}

export interface PhotoStory {
  slug: string
  title: string
  date: string
  location?: string | null
  cover: string | null
  path: string
}
