import { describe, expect, it } from 'vitest'
import path from 'node:path'
import { createPhotoRecord, fileMetaKey, validateUniquePhotoIds } from '../build.mjs'

describe('fileMetaKey', () => {
  it('normalizes staging paths for portable meta.json lookups', () => {
    const staging = path.resolve('/project/gallery-staging')
    const absolute = path.join(staging, '2026-05-06', '02.jpg')

    expect(fileMetaKey(absolute, staging)).toBe('2026-05-06/02.jpg')
    expect(fileMetaKey('2026-05-06/02.jpg', staging)).toBe('2026-05-06/02.jpg')
    expect(fileMetaKey('2026-05-06\\02.jpg', staging)).toBe('2026-05-06/02.jpg')
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

  it('adds story metadata to a photo record', () => {
    expect(createPhotoRecord({
      id: 'photo-id',
      src: { thumb: { webp: 'photo-thumb.webp', w: 480 }, large: { avif: 'photo-large.avif', w: 3840 } },
      size: { w: 1200, h: 900 },
      fileMeta: {},
      storySlug: '2026-05-06',
      storyOrder: 1,
      isCover: true,
      previous: null,
    })).toMatchObject({ storySlug: '2026-05-06', storyOrder: 1, isCover: true })
  })

  it('uses current metadata when reusing a photo record', () => {
    expect(createPhotoRecord({
      id: 'photo-id',
      src: { thumb: { webp: 'photo-thumb.webp', w: 480 } },
      size: { w: 1200, h: 900 },
      fileMeta: { title: 'Current title', alt: 'Current alt', caption: 'Current caption' },
      previous: { w: 1200, h: 900, title: 'Old title', alt: 'Old alt', caption: 'Old caption' },
    })).toMatchObject({
      title: 'Current title',
      alt: 'Current alt',
      caption: 'Current caption',
    })
  })
})

describe('validateUniquePhotoIds', () => {
  it('rejects duplicate content hashes with deterministic source placements', () => {
    expect(() => validateUniquePhotoIds([
      { id: 'duplicate-id', sourcePath: '2026-05-07/02.jpg' },
      { id: 'duplicate-id', sourcePath: '2026-05-06/01.jpg' },
    ])).toThrow('[gallery] duplicate photo id "duplicate-id" at "2026-05-06/01.jpg" and "2026-05-07/02.jpg"')
  })

  it('uses code-point source-path ordering in duplicate diagnostics', () => {
    expect(() => validateUniquePhotoIds([
      { id: 'duplicate-id', sourcePath: 'é-story/photo.jpg' },
      { id: 'duplicate-id', sourcePath: 'a-story/photo.jpg' },
      { id: 'duplicate-id', sourcePath: 'z-story/photo.jpg' },
      { id: 'duplicate-id', sourcePath: '你-story/photo.jpg' },
      { id: 'duplicate-id', sourcePath: 'A-story/photo.jpg' },
      { id: 'duplicate-id', sourcePath: 'Å-story/photo.jpg' },
      { id: 'duplicate-id', sourcePath: 'ä-story/photo.jpg' },
    ])).toThrow('[gallery] duplicate photo id "duplicate-id" at "A-story/photo.jpg" and "a-story/photo.jpg"')
  })
})
