// docs/.vuepress/themes/__tests__/useGalleryRoute.test.ts
import { describe, it, expect } from 'vitest'
import { parseHash, serializeHash } from '../composables/useGalleryRoute'

describe('parseHash', () => {
  it('returns defaults for empty hash', () => {
    expect(parseHash('')).toEqual({ tab: 'timeline' })
    expect(parseHash('#')).toEqual({ tab: 'timeline' })
  })

  it('parses tab and photo id', () => {
    expect(parseHash('#tab=albums&p=abc123'))
      .toEqual({ tab: 'albums', p: 'abc123' })
  })

  it('parses album and tag filters', () => {
    expect(parseHash('#tab=albums&album=x'))
      .toEqual({ tab: 'albums', album: 'x' })
    expect(parseHash('#tab=tags&tag=street'))
      .toEqual({ tab: 'timeline', tag: 'street', tags: ['street'] })
    expect(parseHash('#tags=street,film'))
      .toEqual({ tab: 'timeline', tags: ['street', 'film'] })
  })

  it('falls back to timeline on unknown tab', () => {
    expect(parseHash('#tab=ghost')).toEqual({ tab: 'timeline' })
  })
})

describe('serializeHash', () => {
  it('omits default tab when no other state', () => {
    expect(serializeHash({ tab: 'timeline' })).toBe('')
  })

  it('serializes minimum keys', () => {
    expect(serializeHash({ tab: 'albums', p: 'abc' })).toBe('#tab=albums&p=abc')
  })

  it('roundtrips parse → serialize', () => {
    const r = { tab: 'timeline' as const, tags: ['film', 'street'], p: 'xyz' }
    expect(parseHash(serializeHash(r))).toEqual(r)
  })
})
