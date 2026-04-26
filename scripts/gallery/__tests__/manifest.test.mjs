import { describe, it, expect } from 'vitest'
import { mergePhotos, buildAlbums, buildTags, validateAlbumRefs } from '../manifest.mjs'

const a = { id: 'a', takenAt: '2025-04-01T00:00:00Z', tags: ['street'], albums: ['x'] }
const b = { id: 'b', takenAt: '2025-05-01T00:00:00Z', tags: ['street', 'film'], albums: [] }

describe('mergePhotos', () => {
  it('returns photos sorted by takenAt desc and dedupes by id', () => {
    const merged = mergePhotos([a], [b, { ...a, title: 'updated' }])
    expect(merged[0].id).toBe('b')
    expect(merged[1].id).toBe('a')
    expect(merged[1].title).toBe('updated')
  })
})

describe('buildAlbums', () => {
  it('counts photos per album using config order', () => {
    const cfg = [{ id: 'x', title: 'X', cover: 'a', desc: '', createdAt: '2024-12', photos: ['a'] }]
    const out = buildAlbums(cfg, [a, b])
    expect(out[0].count).toBe(1)
    expect(out[0].cover).toBe('a')
  })
})

describe('buildTags', () => {
  it('aggregates tag frequencies', () => {
    const tags = buildTags([a, b])
    expect(tags.find(t => t.name === 'street').count).toBe(2)
    expect(tags.find(t => t.name === 'film').count).toBe(1)
  })
})

describe('validateAlbumRefs', () => {
  it('throws when an album references an unknown photo id', () => {
    const cfg = [{ id: 'x', photos: ['ghost'] }]
    expect(() => validateAlbumRefs(cfg, [a, b])).toThrow(/ghost/)
  })
})
