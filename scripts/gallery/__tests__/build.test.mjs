import { describe, expect, it } from 'vitest'
import path from 'node:path'
import { createPhotoRecord, fileMetaKey } from '../build.mjs'

describe('fileMetaKey', () => {
  it('normalizes staging paths for portable meta.json lookups', () => {
    const staging = path.resolve('/project/gallery-staging')
    const absolute = path.join(staging, 'stories', '2.jpg')

    expect(fileMetaKey(absolute, staging)).toBe('stories/2.jpg')
    expect(fileMetaKey('stories/2.jpg', staging)).toBe('stories/2.jpg')
    expect(fileMetaKey('stories\\2.jpg', staging)).toBe('stories/2.jpg')
  })
})

describe('createPhotoRecord', () => {
  it('creates a photo record without placeholder fields', () => {
    expect(createPhotoRecord({
      id: 'story-id',
      src: {
        thumb: { webp: 'story-thumb.webp', w: 480 },
        large: { avif: 'story-large.avif', w: 3840 },
      },
      size: { w: 1200, h: 900 },
      fileMeta: { title: null, alt: '', caption: null },
      previous: null,
    })).toEqual({
      id: 'story-id',
      src: {
        thumb: { webp: 'story-thumb.webp', w: 480 },
        large: { avif: 'story-large.avif', w: 3840 },
      },
      w: 1200,
      h: 900,
      title: null,
      alt: '',
      caption: null,
    })
  })
})
