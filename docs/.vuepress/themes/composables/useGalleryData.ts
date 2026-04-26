// docs/.vuepress/themes/composables/useGalleryData.ts
import { ref, type Ref } from 'vue'
import type { Photo, Album, Tag } from '../components/gallery/types'

interface Store {
  photos: Ref<Photo[]>
  albums: Ref<Album[]>
  tags: Ref<Tag[]>
  ready: Ref<boolean>
  error: Ref<string | null>
  reload: () => Promise<void>
}

let store: Store | null = null

export function __resetGalleryData() { store = null }

const BASE = '/gallery/data'

function create(): Store {
  const photos = ref<Photo[]>([])
  const albums = ref<Album[]>([])
  const tags = ref<Tag[]>([])
  const ready = ref(false)
  const error = ref<string | null>(null)

  async function reload() {
    error.value = null
    ready.value = false
    try {
      const [p, a, t] = await Promise.all([
        fetch(`${BASE}/photos.json`).then(r => { if (!r.ok) throw new Error('photos.json'); return r.json() }),
        fetch(`${BASE}/albums.json`).then(r => { if (!r.ok) throw new Error('albums.json'); return r.json() }),
        fetch(`${BASE}/tags.json`).then(r => { if (!r.ok) throw new Error('tags.json'); return r.json() }),
      ])
      photos.value = p
      albums.value = a
      tags.value = t
      ready.value = true
    } catch (e) {
      error.value = (e as Error).message
    }
  }

  reload()
  return { photos, albums, tags, ready, error, reload }
}

export function useGalleryData(): Store {
  if (!store) store = create()
  return store
}
