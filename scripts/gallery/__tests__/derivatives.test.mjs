// scripts/gallery/__tests__/derivatives.test.mjs
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import sharp from 'sharp'
import { generateDerivatives } from '../derivatives.mjs'

const FIX = path.resolve(import.meta.dirname, '../__fixtures__/sample-1.jpg')
let TMP

const COVER_SPECS = [
  { name: 'thumb', width: 480, formats: ['webp'] },
  { name: 'large', width: 3840, formats: ['avif'] },
]

const STORY_SPECS = [
  { name: 'thumb', width: 480, formats: ['webp'] },
  { name: 'large', width: 3840, formats: ['avif'] },
]

beforeAll(async () => { TMP = await fs.mkdtemp(path.join(os.tmpdir(), 'gal-')) })
afterAll(async () => { await fs.rm(TMP, { recursive: true, force: true }) })

describe('generateDerivatives', () => {
  it('writes thumb and large derivatives with expected dimensions', async () => {
    const out = await generateDerivatives(FIX, 'abc123def456', TMP, COVER_SPECS)
    const thumb = path.join(TMP, 'abc123def456-thumb.webp')
    const large = path.join(TMP, 'abc123def456-large.avif')
    const thumbMeta = await sharp(thumb).metadata()
    const largeMeta = await sharp(large).metadata()
    expect(thumbMeta.width).toBe(480)
    expect(largeMeta.width).toBeLessThanOrEqual(2560)
    expect(out).toEqual({
      thumb: { webp: 'abc123def456-thumb.webp', w: 480 },
      large: { avif: 'abc123def456-large.avif', w: 3840 },
    })
  })

  it('writes thumb and large for story specs', async () => {
    const out = await generateDerivatives(FIX, 'story123', TMP, STORY_SPECS)
    const thumb = path.join(TMP, 'story123-thumb.webp')
    const large = path.join(TMP, 'story123-large.avif')
    expect(await fs.access(thumb).then(() => true, () => false)).toBe(true)
    expect(await fs.access(large).then(() => true, () => false)).toBe(true)
    expect(out).toEqual({
      thumb: { webp: 'story123-thumb.webp', w: 480 },
      large: { avif: 'story123-large.avif', w: 3840 },
    })
  })

  it('limits portrait derivatives by their longest edge', async () => {
    const portrait = path.join(TMP, 'portrait-source.jpg')
    await sharp({
      create: {
        width: 900,
        height: 1800,
        channels: 3,
        background: '#446688',
      },
    }).jpeg().toFile(portrait)

    await generateDerivatives(portrait, 'portrait123', TMP, COVER_SPECS)

    const thumbMeta = await sharp(path.join(TMP, 'portrait123-thumb.webp')).metadata()
    expect(Math.max(thumbMeta.width ?? 0, thumbMeta.height ?? 0)).toBe(480)
    expect(thumbMeta.width).toBe(240)
  })

  it('skips already-generated derivatives on second run', async () => {
    const t1 = Date.now()
    await generateDerivatives(FIX, 'abc123def456', TMP, COVER_SPECS)
    const stat = await fs.stat(path.join(TMP, 'abc123def456-thumb.webp'))
    expect(stat.mtimeMs).toBeLessThanOrEqual(t1 + 1000)
  })

  it('replaces stale derivatives when the configured width changes', async () => {
    const thumb = path.join(TMP, 'stale123-thumb.webp')
    const preview = path.join(TMP, 'stale123-preview.webp')
    await sharp(FIX).resize({ width: 320 }).webp({ quality: 82 }).toFile(thumb)
    await sharp(FIX).resize({ width: 1280, withoutEnlargement: true }).webp({ quality: 82 }).toFile(preview)

    await generateDerivatives(FIX, 'stale123', TMP, COVER_SPECS)

    sharp.cache(false)
    const meta = await sharp(thumb).metadata()
    expect(meta.width).toBe(480)
    await expect(fs.access(preview)).rejects.toThrow()
  })

  it('replaces stale portrait derivatives generated with width-only resizing', async () => {
    const portrait = path.join(TMP, 'stale-portrait-source.jpg')
    const thumb = path.join(TMP, 'stalePortrait-thumb.webp')
    await sharp({
      create: {
        width: 900,
        height: 1800,
        channels: 3,
        background: '#668844',
      },
    }).jpeg().toFile(portrait)
    await sharp(portrait).resize({ width: 480 }).webp({ quality: 82 }).toFile(thumb)

    await generateDerivatives(portrait, 'stalePortrait', TMP, COVER_SPECS)

    sharp.cache(false)
    const meta = await sharp(thumb).metadata()
    expect(Math.max(meta.width ?? 0, meta.height ?? 0)).toBe(480)
    expect(meta.width).toBe(240)
  })

  it('removes stale derivative files for a given id', async () => {
    // First generate with cover specs (thumb + large)
    await generateDerivatives(FIX, 'switchRole', TMP, COVER_SPECS)
    expect(await fs.access(path.join(TMP, 'switchRole-thumb.webp')).then(() => true, () => false)).toBe(true)

    // Then generate with story specs (thumb + large)
    await generateDerivatives(FIX, 'switchRole', TMP, STORY_SPECS)
    expect(await fs.access(path.join(TMP, 'switchRole-thumb.webp')).then(() => true, () => false)).toBe(true)
    expect(await fs.access(path.join(TMP, 'switchRole-large.avif')).then(() => true, () => false)).toBe(true)
  })
})
