import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, it, expect } from 'vitest'
import {
  mergePhotos,
  writeManifest,
} from '../manifest.mjs'

const a = { id: 'a', src: '/gallery-img/a/large.webp', w: 600, h: 400, alt: 'A' }
const b = { id: 'b', src: '/gallery-img/b/large.webp', w: 600, h: 400, alt: 'B' }

describe('mergePhotos', () => {
  it('returns photos sorted by id and dedupes by id', () => {
    const merged = mergePhotos([a], [b, { ...a, title: 'updated' }])
    expect(merged[0].id).toBe('a')
    expect(merged[0].title).toBe('updated')
    expect(merged[1].id).toBe('b')
  })
})

describe('writeManifest', () => {
  it('writes only the photos manifest because stories come from markdown', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'gallery-manifest-'))
    try {
      await writeManifest(dir, { photos: [a] })

      expect(JSON.parse(await readFile(join(dir, 'photos.json'), 'utf8'))).toEqual([a])
      await expect(stat(join(dir, 'stories.json'))).rejects.toMatchObject({ code: 'ENOENT' })
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
