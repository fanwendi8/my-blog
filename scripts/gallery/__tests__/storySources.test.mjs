import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { scanStorySources } from '../storySources.mjs'

async function withRoot(fn) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'story-sources-'))
  try {
    await fn(root)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

async function story(root, slug, files, order) {
  const dir = path.join(root, slug)
  await mkdir(dir, { recursive: true })
  for (const [file, contents = 'image'] of Object.entries(files)) {
    const target = path.join(dir, file)
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, contents)
  }
  if (order !== undefined) await writeFile(path.join(dir, 'order.json'), JSON.stringify({ order }))
}

describe('scanStorySources', () => {
  test('discovers images with lexical fallback and cover ordering', async () => {
    await withRoot(async root => {
      await story(root, '2026-05-06', { '02.jpg': '', 'cover.jpg': '', '01.jpg': '', 'meta.json': '' })

      const stories = await scanStorySources(root)

      expect(stories).toEqual([{
        slug: '2026-05-06',
        photos: [
          expect.objectContaining({ relativePath: '01.jpg', storyOrder: 0, isCover: false }),
          expect.objectContaining({ relativePath: '02.jpg', storyOrder: 1, isCover: false }),
          expect.objectContaining({ relativePath: 'cover.jpg', storyOrder: 2, isCover: true }),
        ],
      }])
    })
  })

  test('uses code-point ordering for mixed-case and Unicode image paths without order.json', async () => {
    await withRoot(async root => {
      await story(root, 'story', {
        'é.jpg': '',
        'a-second.jpg': '',
        'z.jpg': '',
        '你.jpg': '',
        'A-first.jpg': '',
        'Å.jpg': '',
        'ä.jpg': '',
      })

      const [result] = await scanStorySources(root)

      expect(result.photos.map(photo => photo.relativePath)).toEqual([
        'A-first.jpg',
        'a-second.jpg',
        'z.jpg',
        'Å.jpg',
        'ä.jpg',
        'é.jpg',
        '你.jpg',
      ])
    })
  })

  test('uses code-point ordering for mixed-case and Unicode story directories', async () => {
    await withRoot(async root => {
      for (const slug of ['é-story', 'a-second-story', 'z-story', '你-story', 'A-first-story', 'Å-story', 'ä-story']) {
        await story(root, slug, { 'photo.jpg': '' })
      }

      const stories = await scanStorySources(root)

      expect(stories.map(story => story.slug)).toEqual([
        'A-first-story',
        'a-second-story',
        'z-story',
        'Å-story',
        'ä-story',
        'é-story',
        '你-story',
      ])
    })
  })

  test('uses explicit order for nested image paths and normalized separators', async () => {
    await withRoot(async root => {
      await story(root, 'story', { 'z.png': '', 'album/cover.jpg': '', 'album/01.jpg': '', 'note.txt': '' }, ['album/01.jpg', 'album/cover.jpg', 'z.png'])

      const [result] = await scanStorySources(root)

      expect(result.photos.map(photo => photo.relativePath)).toEqual(['album/01.jpg', 'album/cover.jpg', 'z.png'])
      expect(result.photos[1]).toEqual(expect.objectContaining({ isCover: true, storyOrder: 1 }))
      expect(result.photos.every(photo => path.isAbsolute(photo.file))).toBe(true)
    })
  })

  test('falls back to the first ordered image as cover', async () => {
    await withRoot(async root => {
      await story(root, 'story', { 'b.jpeg': '', 'a.png': '' })

      const [result] = await scanStorySources(root)

      expect(result.photos).toEqual([
        expect.objectContaining({ relativePath: 'a.png', isCover: true }),
        expect.objectContaining({ relativePath: 'b.jpeg', isCover: false }),
      ])
    })
  })

  test('rejects empty stories and invalid explicit orders', async () => {
    await withRoot(async root => {
      await mkdir(path.join(root, 'empty'))

      await expect(scanStorySources(root)).rejects.toThrow('story "empty" contains no supported images')
    })

    await withRoot(async root => {
      await story(root, 'unknown', { 'a.jpg': '' }, ['a.jpg', 'missing.jpg'])
      await expect(scanStorySources(root)).rejects.toThrow('story "unknown" order.json contains unknown path "missing.jpg"')
    })

    await withRoot(async root => {
      await story(root, 'omitted', { 'a.jpg': '', 'b.jpg': '' }, ['a.jpg'])
      await expect(scanStorySources(root)).rejects.toThrow('story "omitted" order.json omits image path "b.jpg"')
    })
  })

  test('rejects duplicate and multiple explicit cover files', async () => {
    await withRoot(async root => {
      await story(root, 'duplicate', { 'a.jpg': '', 'b.jpg': '' }, ['a.jpg', 'a.jpg'])
      await expect(scanStorySources(root)).rejects.toThrow('story "duplicate" order.json contains duplicate path "a.jpg"')
    })

    await withRoot(async root => {
      await story(root, 'covers', { 'cover.jpg': '', 'nested/cover.png': '' })
      await expect(scanStorySources(root)).rejects.toThrow('story "covers" contains multiple explicit cover files')
    })
  })

  test('rejects non-object order.json roots with deterministic errors', async () => {
    for (const [slug, rootValue] of [['null-root', null], ['string-root', 'order'], ['number-root', 42]]) {
      await withRoot(async root => {
        await story(root, slug, { 'a.jpg': '' })
        await writeFile(path.join(root, slug, 'order.json'), JSON.stringify(rootValue))
        await expect(scanStorySources(root)).rejects.toThrow(`story "${slug}" order.json must contain an order array`)
      })
    }
  })

  test('validates an explicitly empty order array', async () => {
    await withRoot(async root => {
      await story(root, 'empty-order', { 'a.jpg': '' }, [])

      await expect(scanStorySources(root)).rejects.toThrow('story "empty-order" order.json omits image path "a.jpg"')
    })
  })
})
