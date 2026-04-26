import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { extractExif } from '../exif.mjs'

const FIX = path.resolve(import.meta.dirname, '../__fixtures__')

describe('extractExif', () => {
  it('returns w, h and takenAt fallback when EXIF is absent', async () => {
    const meta = await extractExif(path.join(FIX, 'sample-1.jpg'))
    expect(meta.w).toBe(600)
    expect(meta.h).toBe(400)
    expect(typeof meta.takenAt).toBe('string')
    expect(meta.takenAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('returns null exif and gps when no metadata', async () => {
    const meta = await extractExif(path.join(FIX, 'sample-1.jpg'))
    expect(meta.exif).toBeNull()
    expect(meta.gps).toBeNull()
  })
})
