// docs/.vuepress/themes/__tests__/useFiltering.test.ts
import { describe, it, expect } from 'vitest'
import { filterPhotos } from '../composables/useFiltering'
import type { Photo } from '../components/gallery/types'

const p = (id: string, opts: Partial<Photo>): Photo => ({
  id, src: { thumb: `${id}/thumb.webp`, large: `${id}/large.webp` },
  w: 600, h: 400, blurhash: 'L', albums: [], tags: [], takenAt: '2025-01-01T00:00:00Z',
  ...opts,
})

const all: Photo[] = [
  p('a', { tags: ['street'], albums: ['x'], takenAt: '2025-04-01T00:00:00Z' }),
  p('b', { tags: ['film'], albums: ['x'], takenAt: '2025-03-01T00:00:00Z' }),
  p('c', { tags: ['street', 'film'], albums: [], takenAt: '2024-12-01T00:00:00Z' }),
]

describe('filterPhotos', () => {
  it('returns all when no filter', () => {
    expect(filterPhotos(all, {}).length).toBe(3)
  })

  it('filters by album', () => {
    const got = filterPhotos(all, { album: 'x' })
    expect(got.map(p => p.id)).toEqual(['a', 'b'])
  })

  it('filters by tag', () => {
    const got = filterPhotos(all, { tag: 'film' })
    expect(got.map(p => p.id)).toEqual(['b', 'c'])
  })

  it('combines tag and album filters (AND)', () => {
    const got = filterPhotos(all, { album: 'x', tag: 'film' })
    expect(got.map(p => p.id)).toEqual(['b'])
  })
})
