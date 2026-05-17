import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { scanDirectory, contentHash } from '../scan.mjs'

const FIX = path.resolve(import.meta.dirname, '../__fixtures__')

describe('scanDirectory', () => {
  it('lists jpg files only and returns absolute paths', async () => {
    const files = await scanDirectory(FIX)
    expect(files.length).toBeGreaterThanOrEqual(2)
    expect(files.every(f => path.isAbsolute(f))).toBe(true)
    expect(files.every(f => /\.jpe?g$/i.test(f))).toBe(true)
  })
})

describe('contentHash', () => {
  it('returns 12-char hex prefix that is stable for the same file', async () => {
    const f = path.join(FIX, 'sample-1.jpg')
    const a = await contentHash(f)
    const b = await contentHash(f)
    expect(a).toBe(b)
    expect(a).toMatch(/^[a-f0-9]{12}$/)
  })

  it('returns different hashes for different files', async () => {
    const a = await contentHash(path.join(FIX, 'sample-1.jpg'))
    const b = await contentHash(path.join(FIX, 'sample-2.jpg'))
    expect(a).not.toBe(b)
  })
})
