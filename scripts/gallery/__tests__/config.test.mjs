import { describe, expect, it } from 'vitest'
import { DERIVATIVES } from '../config.mjs'

describe('gallery derivative config', () => {
  it('generates thumb and large for story photos', () => {
    expect(DERIVATIVES.story).toEqual([
      { name: 'thumb', width: 480, formats: ['webp'] },
      { name: 'large', width: 3840, formats: ['avif'] },
    ])
  })
})
