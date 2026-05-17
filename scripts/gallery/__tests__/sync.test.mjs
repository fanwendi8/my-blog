import { describe, expect, it } from 'vitest'
import {
  extractObjectKeys,
  findMissingObjects,
  prefixedObjectKey,
  remoteManifestKey,
  planPrune,
} from '../sync.mjs'

describe('extractObjectKeys', () => {
  it('returns sorted derivative keys from the photo manifest', () => {
    const photos = [
      {
        id: 'b',
        src: {
          large: { w: 3840, avif: 'b-large.avif' },
          thumb: { w: 480, webp: 'b-thumb.webp' },
        },
      },
      {
        id: 'a',
        src: {
          large: { w: 3840, avif: 'a-large.avif' },
        },
      },
    ]

    expect(extractObjectKeys(photos)).toEqual([
      'a-large.avif',
      'b-large.avif',
      'b-thumb.webp',
    ])
  })

  it('ignores legacy string src values and non-path fields', () => {
    const photos = [
      { id: 'legacy', src: 'legacy.jpg' },
      { id: 'empty', src: { large: { w: 3840 } } },
    ]

    expect(extractObjectKeys(photos)).toEqual([])
  })
})

describe('planPrune', () => {
  it('only prunes objects previously managed by gallery sync', () => {
    expect(planPrune(
      ['old-large.avif', 'keep-large.avif', 'foreign.avif'],
      ['keep-large.avif', 'new-large.avif'],
    )).toEqual(['foreign.avif', 'old-large.avif'])
  })
})

describe('findMissingObjects', () => {
  it('returns keys that do not exist in R2', async () => {
    const fake = {
      send: async (cmd) => {
        if (cmd.input.Key === 'exists.avif') return {}
        const err = new Error('not found')
        err.name = 'NotFound'
        throw err
      },
    }

    await expect(findMissingObjects(fake, 'bucket', ['exists.avif', 'missing.avif']))
      .resolves.toEqual(['missing.avif'])
  })
})

describe('prefixedObjectKey', () => {
  it('places story derivatives under the configured R2 prefix', () => {
    expect(prefixedObjectKey('story-img', 'abc-large.avif')).toBe('story-img/abc-large.avif')
    expect(prefixedObjectKey('/story-img/', 'abc-large.avif')).toBe('story-img/abc-large.avif')
  })

  it('keeps root keys unchanged when no prefix is configured', () => {
    expect(prefixedObjectKey('', 'abc-large.avif')).toBe('abc-large.avif')
  })
})

describe('remoteManifestKey', () => {
  it('stores the sync manifest inside the same remote prefix', () => {
    expect(remoteManifestKey('story-img')).toBe('story-img/.r2-manifest.json')
  })

  it('stores the sync manifest at the bucket root when no prefix is configured', () => {
    expect(remoteManifestKey('')).toBe('.r2-manifest.json')
  })
})
