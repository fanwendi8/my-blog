import { describe, expect, it } from 'vitest'
import { largeSrc, thumbSrc } from '../gallery/photoSources'
import type { Photo } from '../gallery/types'

const oldPhoto: Photo = {
  id: 'old',
  src: { thumb: 'old/thumb.webp', preview: 'old/preview.webp', large: 'old/large.webp' },
  w: 600,
  h: 400,
}

const coverPhoto: Photo = {
  id: 'cover',
  src: {
    thumb: { webp: 'cover-thumb.webp', w: 480 },
    large: { avif: 'cover-large.avif', w: 3840 },
  },
  w: 600,
  h: 400,
  title: 'Cover photo',
}

const storyPhoto: Photo = {
  id: 'story',
  src: {
    thumb: { webp: 'story-thumb.webp', w: 480 },
    large: { avif: 'story-large.avif', w: 3840 },
  },
  w: 600,
  h: 400,
  title: 'Story photo',
}

const simplePhoto: Photo = {
  id: 'simple',
  src: '/gallery-img/simple/large.webp',
  w: 600,
  h: 400,
  alt: 'Simple photo',
}

describe('photoSources', () => {
  it('keeps old manifest string paths readable', () => {
    expect(thumbSrc(oldPhoto)).toBe('/gallery-img/old/thumb.webp')
    expect(largeSrc(oldPhoto)).toBe('/gallery-img/old/large.webp')
  })

  it('uses thumb webp for cover photos', () => {
    expect(thumbSrc(coverPhoto)).toBe('/gallery-img/cover-thumb.webp')
    expect(largeSrc(coverPhoto, { viewportWidth: 1440, devicePixelRatio: 1 }))
      .toBe('/gallery-img/cover-large.avif')
  })

  it('uses the story thumb source when available', () => {
    expect(thumbSrc(storyPhoto)).toBe('/gallery-img/story-thumb.webp')
    expect(largeSrc(storyPhoto, { viewportWidth: 1440, devicePixelRatio: 1 }))
      .toBe('/gallery-img/story-large.avif')
  })

  it('keeps very large displays on the single large AVIF', () => {
    expect(largeSrc(coverPhoto, { viewportWidth: 3840, devicePixelRatio: 1 }))
      .toBe('/gallery-img/cover-large.avif')
    expect(largeSrc(coverPhoto, { viewportWidth: 1920, devicePixelRatio: 2 }))
      .toBe('/gallery-img/cover-large.avif')
  })

  it('keeps high-DPR mobile viewports on large AVIF', () => {
    expect(largeSrc(coverPhoto, { viewportWidth: 430, devicePixelRatio: 3 }))
      .toBe('/gallery-img/cover-large.avif')
  })

  it('supports lightweight string sources', () => {
    expect(thumbSrc(simplePhoto)).toBe('/gallery-img/simple/large.webp')
    expect(largeSrc(simplePhoto)).toBe('/gallery-img/simple/large.webp')
  })
})
