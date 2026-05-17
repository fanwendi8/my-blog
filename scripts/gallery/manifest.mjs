// scripts/gallery/manifest.mjs
import fs from 'node:fs/promises'
import path from 'node:path'

export function mergePhotos(prev, next) {
  const map = new Map(prev.map(p => [p.id, p]))
  for (const p of next) map.set(p.id, p)
  return [...map.values()].sort((a, b) => a.id.localeCompare(b.id))
}

export async function writeManifest(dir, { photos }) {
  await fs.mkdir(dir, { recursive: true })
  await atomicWrite(path.join(dir, 'photos.json'), JSON.stringify(photos))
  await fs.rm(path.join(dir, 'stories.json'), { force: true })
}

export async function readPhotosOrEmpty(dir) {
  try { return JSON.parse(await fs.readFile(path.join(dir, 'photos.json'), 'utf8')) }
  catch { return [] }
}

async function atomicWrite(file, content) {
  const tmp = `${file}.tmp`
  await fs.writeFile(tmp, content, 'utf8')
  await fs.rename(tmp, file)
}
