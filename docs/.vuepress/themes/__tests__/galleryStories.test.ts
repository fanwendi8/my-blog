import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, it, vi } from 'vitest'
import { galleryPhotosPlugin, galleryStoryPagesPlugin, galleryStoriesPlugin, readGalleryStories } from '../../galleryStories'

describe('readGalleryStories', () => {
  it('builds the story index from gallery markdown frontmatter', async () => {
    const root = await mkdtemp(join(tmpdir(), 'gallery-stories-'))
    try {
      await writeFile(join(root, 'README.md'), `---
title: Gallery
home: true
permalink: /gallery/
---
`)
      await writeFile(join(root, 'daily.md'), `---
title: Daily Walk
date: 2025-01-02
location: Beijing
cover: a
permalink: /gallery/daily/
---
`)
      await writeFile(join(root, 'empty.md'), `---
title: Empty
date: 2025-01-03
permalink: /gallery/empty/
---
`)

      expect(await readGalleryStories(root)).toEqual([
        {
          slug: 'daily',
          title: 'Daily Walk',
          date: '2025-01-02',
          location: 'Beijing',
          cover: 'a',
          path: '/gallery/daily/',
        },
      ])
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it('uses the filename slug for the fallback path', async () => {
    const root = await mkdtemp(join(tmpdir(), 'gallery-stories-'))
    try {
      await writeFile(join(root, 'late-night.md'), `---
title: Late Night
date: 2024-12-31
cover: z
---
`)

      expect(await readGalleryStories(root)).toEqual([
        {
          slug: 'late-night',
          title: 'Late Night',
          date: '2024-12-31',
          location: null,
          cover: 'z',
          path: '/gallery/late-night/',
        },
      ])
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})

describe('galleryStoriesPlugin', () => {
  it('watches gallery markdown files and reloads the virtual story module in dev', () => {
    const plugin = galleryStoriesPlugin('/project/docs/gallery')
    const mod = { id: '\0virtual:gallery-stories' }
    const server = {
      watcher: { add: vi.fn() },
      moduleGraph: {
        getModuleById: vi.fn(() => mod),
        invalidateModule: vi.fn(),
      },
      ws: { send: vi.fn() },
    }

    plugin.configureServer?.(server as never)
    const result = plugin.handleHotUpdate?.({
      file: '/project/docs/gallery/new-story.md',
      server,
    } as never)

    expect(server.watcher.add).toHaveBeenCalledWith('/project/docs/gallery')
    expect(server.moduleGraph.getModuleById).toHaveBeenCalledWith('\0virtual:gallery-stories')
    expect(server.moduleGraph.invalidateModule).toHaveBeenCalledWith(mod)
    expect(server.ws.send).toHaveBeenCalledWith({ type: 'full-reload' })
    expect(result).toEqual([])
  })
})

describe('galleryStoryPagesPlugin', () => {
  it('disables aside, outline, and comments for gallery story pages only', () => {
    const plugin = galleryStoryPagesPlugin('/project/docs/gallery')
    const story = {
      filePath: '/project/docs/gallery/daily.md',
      frontmatter: {},
    }
    const home = {
      filePath: '/project/docs/gallery/README.md',
      frontmatter: {},
    }

    plugin.extendsPage?.(story as never)
    plugin.extendsPage?.(home as never)

    expect(story.frontmatter).toMatchObject({
      aside: false,
      outline: false,
      comments: false,
    })
    expect(home.frontmatter).toEqual({})
  })

  it('overrides an explicitly enabled comment setting on gallery stories', () => {
    const plugin = galleryStoryPagesPlugin('/project/docs/gallery')
    const story = {
      filePath: '/project/docs/gallery/daily.md',
      frontmatter: { comments: true },
    }

    plugin.extendsPage?.(story as never)

    expect(story.frontmatter.comments).toBe(false)
  })
})

describe('galleryPhotosPlugin', () => {
  it('loads the photos manifest into a virtual module', async () => {
    const root = await mkdtemp(join(tmpdir(), 'gallery-photos-'))
    try {
      const manifest = join(root, 'photos.json')
      await writeFile(manifest, JSON.stringify([
        {
          id: 'a',
          src: { thumb: { webp: 'a/thumb.webp', w: 480 }, large: { avif: 'a/large.avif', w: 2560 } },
          w: 600,
          h: 400,
        },
      ]))
      const plugin = galleryPhotosPlugin(manifest)

      expect(plugin.resolveId?.('virtual:gallery-photos')).toBe('\0virtual:gallery-photos')
      const result = await plugin.load?.('\0virtual:gallery-photos')
      expect(result).not.toContain('placeholder')
      expect(result).not.toContain('bg')
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
