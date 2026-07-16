import { describe, expect, it } from 'vitest'
import { createStoryPhotoSwipeItems } from '../gallery/storyPhotoSwipe'
import type { Photo } from '../gallery/types'

const photos: Photo[] = [
  {
    id: 'a',
    src: {
      thumb: { webp: 'a-thumb.webp' },
      large: { avif: 'a-large.avif' },
    },
    w: 600,
    h: 400,
    alt: 'A',
  },
  {
    id: 'b',
    src: {
      thumb: { webp: 'b-thumb.webp' },
      large: { avif: 'b-large.avif' },
    },
    w: 400,
    h: 600,
    alt: 'B',
  },
]

describe('createStoryPhotoSwipeItems', () => {
  it('keeps requested order, skips missing IDs, and combines thumb, large, alt, and caption', () => {
    const items = createStoryPhotoSwipeItems(photos, ['b', 'missing', 'a'], { b: 'Story caption' })

    expect(items).toEqual([
      {
        type: 'image',
        src: '/gallery-img/b-large.avif',
        msrc: '/gallery-img/b-thumb.webp',
        width: 400,
        height: 600,
        alt: 'B',
        caption: 'Story caption',
      },
      {
        type: 'image',
        src: '/gallery-img/a-large.avif',
        msrc: '/gallery-img/a-thumb.webp',
        width: 600,
        height: 400,
        alt: 'A',
      },
    ])
  })

  it('uses photo metadata caption when a story caption is absent', () => {
    expect(createStoryPhotoSwipeItems([
      { ...photos[0], caption: 'Manifest caption' },
    ], ['a'])[0].caption).toBe('Manifest caption')
  })
})
