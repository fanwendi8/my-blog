// scripts/gallery/__tests__/blurhash.test.mjs
import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { encodeBlurhash } from '../blurhash.mjs'

const FIX = path.resolve(import.meta.dirname, '../__fixtures__/sample-1.jpg')

describe('encodeBlurhash', () => {
  it('returns a non-empty short string', async () => {
    const hash = await encodeBlurhash(FIX)
    expect(typeof hash).toBe('string')
    expect(hash.length).toBeGreaterThan(20)
    expect(hash.length).toBeLessThan(40)
  })

  it('is deterministic for the same input', async () => {
    expect(await encodeBlurhash(FIX)).toBe(await encodeBlurhash(FIX))
  })
})
