import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { useGalleryData, __resetGalleryData } from '../composables/useGalleryData'

const PHOTOS = vi.hoisted(() => [{ id: 'a', src: '/gallery-img/a/large.webp', w: 600, h: 400, alt: 'A' }])
const STORIES = vi.hoisted(() => [{
  slug: 'daily',
  title: 'Daily',
  date: '2025-01-01',
  location: 'Beijing',
  cover: 'a',
  count: 1,
  photos: ['a'],
  path: '/gallery/daily/',
}])

vi.mock('virtual:gallery-stories', () => ({
  stories: STORIES,
}), { virtual: true })

vi.mock('virtual:gallery-photos', () => ({
  photos: PHOTOS,
}), { virtual: true })

beforeEach(() => {
  __resetGalleryData()
  globalThis.fetch = vi.fn((url: string) => {
    const body = url.endsWith('photos.json') ? PHOTOS : STORIES
    return Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response)
  })
})

describe('useGalleryData', () => {
  it('starts with build-time photos and markdown-derived stories', async () => {
    const { photos, stories, ready } = useGalleryData()

    expect(ready.value).toBe(true)
    expect(photos.value[0].id).toBe('a')
    expect(stories.value[0].slug).toBe('daily')
    await flushPromises()

    expect(ready.value).toBe(true)
    expect(photos.value[0].id).toBe('a')
    expect(stories.value[0].slug).toBe('daily')
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('shares loaded state between calls', async () => {
    useGalleryData()
    await flushPromises()
    expect(globalThis.fetch).not.toHaveBeenCalled()
    useGalleryData()
    await flushPromises()
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('can manually reload the runtime photos manifest', async () => {
    const nextPhotos = [{ id: 'b', src: '/gallery-img/b/large.avif', w: 800, h: 600, alt: 'B' }]
    globalThis.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(nextPhotos),
    } as Response))

    const { photos, reload } = useGalleryData()
    await reload()

    expect(photos.value[0].id).toBe('b')
    expect(globalThis.fetch).toHaveBeenCalledWith('/gallery/data/photos.json', { cache: 'no-store' })
  })

  it('records error state on manual reload failure', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('boom')))

    const { error, ready, reload } = useGalleryData()
    await reload()

    expect(ready.value).toBe(true)
    expect(error.value).toMatch(/boom/)
  })
})
