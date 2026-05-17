import { ref, type Ref } from 'vue'
import type { Photo, PhotoStory } from '../gallery/types'
import { photos as buildPhotos } from 'virtual:gallery-photos'
import { stories as markdownStories } from 'virtual:gallery-stories'

interface Store {
  photos: Ref<Photo[]>
  stories: Ref<PhotoStory[]>
  ready: Ref<boolean>
  error: Ref<string | null>
  reload: () => Promise<void>
}

let store: Store | null = null

export function __resetGalleryData() { store = null }

const BASE = '/gallery/data'

async function fetchManifest<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE}/${path}`, { cache: 'no-store' })
  if (!response.ok) throw new Error(path)
  return response.json()
}

function create(): Store {
  const photos = ref<Photo[]>(buildPhotos)
  const stories = ref<PhotoStory[]>(markdownStories)
  const ready = ref(true)
  const error = ref<string | null>(null)

  async function reload() {
    error.value = null
    try {
      const p = await fetchManifest<Photo[]>('photos.json')
      photos.value = p
      stories.value = markdownStories
      ready.value = true
    } catch (e) {
      error.value = (e as Error).message
    }
  }

  return { photos, stories, ready, error, reload }
}

export function useGalleryData(): Store {
  if (!store) store = create()
  return store
}
