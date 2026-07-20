import { describe, expect, it } from 'vitest'
import { PHOTO_DERIVATIVES } from '../config.mjs'

describe('gallery derivative config', () => {
  it('generates shared thumb and large derivatives for every photo', () => {
    expect(PHOTO_DERIVATIVES).toEqual([
      { name: 'thumb', width: 480, formats: ['webp'] },
      { name: 'large', width: 3840, formats: ['avif'] },
    ])
  })
})
