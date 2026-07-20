import { readdir, readFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import type { Plugin } from 'vite'
import type { PluginObject } from 'vuepress/core'
import type { PhotoStory } from './themes/gallery/types'

const MODULE_ID = 'virtual:gallery-stories'
const RESOLVED_MODULE_ID = `\0${MODULE_ID}`
const PHOTOS_MODULE_ID = 'virtual:gallery-photos'
const RESOLVED_PHOTOS_MODULE_ID = `\0${PHOTOS_MODULE_ID}`

type FrontmatterValue = string | string[] | boolean
type Frontmatter = Record<string, FrontmatterValue>

function unquote(value: string): string {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
    || (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function parseScalar(value: string): FrontmatterValue {
  const trimmed = value.trim()
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (trimmed === '[]') return []
  return unquote(trimmed)
}

export function parseFrontmatter(source: string): Frontmatter {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) return {}

  const out: Frontmatter = {}
  const lines = match[1].split(/\r?\n/)
  let arrayKey: string | null = null

  for (const line of lines) {
    if (!line.trim()) continue

    const arrayItem = line.match(/^\s+-\s*(.*)$/)
    if (arrayItem && arrayKey) {
      const current = out[arrayKey]
      if (Array.isArray(current)) current.push(unquote(arrayItem[1]))
      continue
    }

    const pair = line.match(/^([A-Za-z][\w-]*):(?:\s*(.*))?$/)
    if (!pair) {
      arrayKey = null
      continue
    }

    const [, key, rawValue = ''] = pair
    if (rawValue === '') {
      out[key] = []
      arrayKey = key
    } else {
      out[key] = parseScalar(rawValue)
      arrayKey = null
    }
  }

  return out
}

function toStringOrNull(value: FrontmatterValue | undefined): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function toStringOrFallback(value: FrontmatterValue | undefined, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback
}

export async function readGalleryStories(galleryDir: string): Promise<PhotoStory[]> {
  const entries = await readdir(galleryDir, { withFileTypes: true })
  const stories: PhotoStory[] = []

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md') || entry.name === 'README.md') continue

    const slug = basename(entry.name, '.md')
    const frontmatter = parseFrontmatter(await readFile(join(galleryDir, entry.name), 'utf8'))
    const cover = toStringOrNull(frontmatter.cover)

    stories.push({
      slug,
      title: toStringOrFallback(frontmatter.title, slug),
      date: toStringOrFallback(frontmatter.date, ''),
      location: toStringOrNull(frontmatter.location),
      cover,
      path: toStringOrFallback(frontmatter.permalink, `/gallery/${slug}/`),
    })
  }

  return stories.sort((a, b) => b.date.localeCompare(a.date))
}

export function galleryStoriesPlugin(galleryDir: string): Plugin {
  function isGalleryMarkdown(file: string): boolean {
    return file.startsWith(galleryDir) && file.endsWith('.md')
  }

  return {
    name: 'gallery-stories',
    configureServer(server) {
      server.watcher.add(galleryDir)
    },
    resolveId(id) {
      return id === MODULE_ID ? RESOLVED_MODULE_ID : null
    },
    async load(id) {
      if (id !== RESOLVED_MODULE_ID) return null
      const stories = await readGalleryStories(galleryDir)
      return `export const stories = ${JSON.stringify(stories, null, 2)}\n`
    },
    handleHotUpdate(ctx) {
      if (!isGalleryMarkdown(ctx.file)) return

      const mod = ctx.server.moduleGraph.getModuleById(RESOLVED_MODULE_ID)
      if (mod) ctx.server.moduleGraph.invalidateModule(mod)
      ctx.server.ws.send({ type: 'full-reload' })
      return []
    },
  }
}

export function galleryStoryPagesPlugin(galleryDir: string): PluginObject {
  function isGalleryStoryPage(filePath: string | null | undefined): boolean {
    return Boolean(
      filePath
      && filePath.startsWith(galleryDir)
      && filePath.endsWith('.md')
      && basename(filePath) !== 'README.md',
    )
  }

  return {
    name: 'gallery-story-pages',
    extendsPage(page) {
      if (!isGalleryStoryPage(page.filePath)) return
      page.frontmatter.aside ??= false
      page.frontmatter.outline ??= false
      page.frontmatter.comments = false
    },
  }
}

export function galleryPhotosPlugin(photosFile: string): Plugin {
  return {
    name: 'gallery-photos',
    configureServer(server) {
      server.watcher.add(photosFile)
    },
    resolveId(id) {
      return id === PHOTOS_MODULE_ID ? RESOLVED_PHOTOS_MODULE_ID : null
    },
    async load(id) {
      if (id !== RESOLVED_PHOTOS_MODULE_ID) return null
      try {
        const photos = JSON.parse(await readFile(photosFile, 'utf8'))
        return `export const photos = ${JSON.stringify(photos, null, 2)}\n`
      } catch {
        return 'export const photos = []\n'
      }
    },
    handleHotUpdate(ctx) {
      if (ctx.file !== photosFile) return

      const mod = ctx.server.moduleGraph.getModuleById(RESOLVED_PHOTOS_MODULE_ID)
      if (mod) ctx.server.moduleGraph.invalidateModule(mod)
      ctx.server.ws.send({ type: 'full-reload' })
      return []
    },
  }
}
