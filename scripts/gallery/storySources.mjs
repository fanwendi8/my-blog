import path from 'node:path'
import { readdir, readFile } from 'node:fs/promises'

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png'])

function storyError(slug, message) {
  return new Error(`story "${slug}" ${message}`)
}

function isSupportedImage(file) {
  return file.isFile() && IMAGE_EXTENSIONS.has(path.extname(file.name).toLowerCase())
}

async function discoverImages(directory, relative = '') {
  const entries = await readdir(directory, { withFileTypes: true })
  const images = []
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)
    const entryRelative = relative ? path.join(relative, entry.name) : entry.name
    if (isSupportedImage(entry)) {
      images.push({ file: entryPath, relativePath: entryRelative.split(path.sep).join('/') })
    } else if (entry.isDirectory()) {
      images.push(...await discoverImages(entryPath, entryRelative))
    }
  }
  return images
}

async function orderImages(storyDir, slug, images) {
  const orderFile = path.join(storyDir, 'order.json')
  let order
  try {
    const parsed = JSON.parse(await readFile(orderFile, 'utf8'))
    order = parsed.order
  } catch (error) {
    if (error.code === 'ENOENT') {
      const ordered = [...images].sort((a, b) => a.relativePath.localeCompare(b.relativePath))
      const coverIndex = ordered.findIndex(image => path.basename(image.relativePath, path.extname(image.relativePath)).toLowerCase() === 'cover')
      if (coverIndex > 1) ordered.splice(1, 0, ordered.splice(coverIndex, 1)[0])
      return ordered
    }
    if (error instanceof SyntaxError) throw storyError(slug, 'order.json is invalid JSON')
    throw error
  }

  if (!Array.isArray(order)) throw storyError(slug, 'order.json must contain an order array')
  const discovered = new Map(images.map(image => [image.relativePath, image]))
  const seen = new Set()
  for (const relativePath of order) {
    if (typeof relativePath !== 'string') throw storyError(slug, 'order.json contains a non-string path')
    const normalized = relativePath.split(path.sep).join('/')
    if (seen.has(normalized)) throw storyError(slug, `order.json contains duplicate path "${normalized}"`)
    if (!discovered.has(normalized)) throw storyError(slug, `order.json contains unknown path "${normalized}"`)
    seen.add(normalized)
  }
  if (seen.size !== discovered.size) {
    const omitted = [...discovered.keys()].find(relativePath => !seen.has(relativePath))
    throw storyError(slug, `order.json omits image path "${omitted}"`)
  }
  return order.map(relativePath => discovered.get(relativePath.split(path.sep).join('/')))
}

export async function scanStorySources(stagingRoot) {
  const entries = await readdir(stagingRoot, { withFileTypes: true })
  const stories = []
  for (const entry of entries.filter(entry => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const slug = entry.name
    const storyDir = path.join(stagingRoot, slug)
    const discovered = await discoverImages(storyDir)
    if (discovered.length === 0) throw storyError(slug, 'contains no supported images')
    const photos = await orderImages(storyDir, slug, discovered)
    const explicitCovers = photos.filter(photo => path.basename(photo.relativePath, path.extname(photo.relativePath)).toLowerCase() === 'cover')
    if (explicitCovers.length > 1) throw storyError(slug, 'contains multiple explicit cover files')
    const cover = explicitCovers[0] ?? photos[0]
    stories.push({
      slug,
      photos: photos.map((photo, storyOrder) => ({ ...photo, storyOrder, isCover: photo === cover })),
    })
  }
  return stories
}
