import { describe, it, expect, vi } from 'vitest'
import path from 'node:path'
import { extractExif } from '../exif.mjs'

const FIX = path.resolve(import.meta.dirname, '../__fixtures__')

vi.mock('exifr', async (importOriginal) => {
  const mod = await importOriginal()
  const realParse = mod.default.parse.bind(mod.default)
  return {
    ...mod,
    default: {
      ...mod.default,
      parse: vi.fn((...args) => realParse(...args)),
    },
  }
})

const exifr = (await import('exifr')).default

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

  it('normalizes EXIF-present output with camera, lens, exposure, and GPS', async () => {
    const SYNTH_EXIF = {
      Make: 'SONY',
      Model: 'ILCE-7M4',
      LensModel: 'FE 35mm F1.4 GM',
      FocalLength: 35,
      FNumber: 1.4,
      ISO: 100,
      ExposureTime: 0.004,
      DateTimeOriginal: new Date('2026-04-20T10:00:00.000Z'),
      latitude: 35.681,
      longitude: 139.767,
    }
    exifr.parse.mockResolvedValueOnce(SYNTH_EXIF)
    const meta = await extractExif(path.join(FIX, 'sample-1.jpg'))
    expect(meta.w).toBe(600)
    expect(meta.h).toBe(400)
    expect(meta.takenAt).toBe('2026-04-20T10:00:00.000Z')
    expect(meta.exif).toEqual({
      camera: 'SONY ILCE-7M4',
      lens: 'FE 35mm F1.4 GM',
      fl: 35,
      fn: 1.4,
      iso: 100,
      exp: '1/250',
    })
    expect(meta.gps).toEqual({ lat: 35.681, lon: 139.767 })
  })
})
