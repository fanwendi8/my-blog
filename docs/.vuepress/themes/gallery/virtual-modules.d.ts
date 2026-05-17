declare module 'virtual:gallery-stories' {
  import type { PhotoStory } from './types'

  export const stories: PhotoStory[]
}

declare module 'virtual:gallery-photos' {
  import type { Photo } from './types'

  export const photos: Photo[]
}
