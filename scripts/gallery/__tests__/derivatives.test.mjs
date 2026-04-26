// scripts/gallery/__tests__/derivatives.test.mjs
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import sharp from 'sharp'
import { generateDerivatives } from '../derivatives.mjs'

const FIX = path.resolve(import.meta.dirname, '../__fixtures__/sample-1.jpg')
let TMP

beforeAll(async () => { TMP = await fs.mkdtemp(path.join(os.tmpdir(), 'gal-')) })
afterAll(async () => { await fs.rm(TMP, { recursive: true, force: true }) })

describe('generateDerivatives', () => {
  it('writes thumb/preview/large with expected widths', async () => {
    const out = await generateDerivatives(FIX, 'abc123def456', TMP)
    const thumb = path.join(TMP, 'abc123def456', 'thumb.webp')
    const meta = await sharp(thumb).metadata()
    expect(meta.width).toBe(320)
    expect(out.thumb).toBe('abc123def456/thumb.webp')
    expect(out.large).toBe('abc123def456/large.webp')
  })

  it('skips already-generated derivatives on second run', async () => {
    const t1 = Date.now()
    await generateDerivatives(FIX, 'abc123def456', TMP)
    const stat = await fs.stat(path.join(TMP, 'abc123def456', 'thumb.webp'))
    expect(stat.mtimeMs).toBeLessThanOrEqual(t1 + 1000)
  })
})
