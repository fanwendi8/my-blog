// docs/.vuepress/themes/__tests__/useGalleryData.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { useGalleryData, __resetGalleryData } from '../composables/useGalleryData'

const PHOTOS = [{ id: 'a', src: { thumb: 'a/thumb.webp', large: 'a/large.webp' }, w: 600, h: 400, blurhash: 'L', takenAt: '2025-04-01T00:00:00Z', albums: [], tags: [] }]
const ALBUMS = [{ id: 'x', title: 'X', desc: '', cover: 'a', count: 1, createdAt: null }]
const TAGS = [{ name: 'street', count: 5 }]

beforeEach(() => {
  __resetGalleryData()
  globalThis.fetch = vi.fn((url: string) => {
    const body = url.endsWith('photos.json') ? PHOTOS : url.endsWith('albums.json') ? ALBUMS : TAGS
    return Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response)
  })
})

describe('useGalleryData', () => {
  it('fetches all three manifests and exposes them as refs', async () => {
    const { photos, albums, tags, ready } = useGalleryData()
    expect(ready.value).toBe(false)
    await flushPromises()
    expect(ready.value).toBe(true)
    expect(photos.value).toHaveLength(1)
    expect(albums.value[0].title).toBe('X')
    expect(tags.value[0].name).toBe('street')
  })

  it('shares state between calls (singleton)', async () => {
    useGalleryData()
    await flushPromises()
    expect(globalThis.fetch).toHaveBeenCalledTimes(3)
    useGalleryData()
    await flushPromises()
    expect(globalThis.fetch).toHaveBeenCalledTimes(3)     // 没有再次请求
  })

  it('records error state on fetch failure', async () => {
    __resetGalleryData()
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('boom')))
    const { error, ready } = useGalleryData()
    await flushPromises()
    expect(ready.value).toBe(false)
    expect(error.value).toMatch(/boom/)
  })
})
