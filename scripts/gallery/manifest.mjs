// scripts/gallery/manifest.mjs
import fs from 'node:fs/promises'
import path from 'node:path'

export function mergePhotos(prev, next) {
  const map = new Map(prev.map(p => [p.id, p]))
  for (const p of next) map.set(p.id, p)
  return [...map.values()].sort((a, b) => b.takenAt.localeCompare(a.takenAt))
}

export function validateAlbumRefs(albumCfg, photos) {
  const ids = new Set(photos.map(p => p.id))
  for (const a of albumCfg) {
    for (const pid of a.photos ?? []) {
      if (!ids.has(pid)) throw new Error(`Album "${a.id}" references unknown photo id: ${pid}`)
    }
  }
}

export function buildAlbums(albumCfg, photos) {
  validateAlbumRefs(albumCfg, photos)
  const byId = new Map(photos.map(p => [p.id, p]))
  return albumCfg.map(a => ({
    id: a.id,
    title: a.title,
    desc: a.desc ?? '',
    cover: a.cover && byId.has(a.cover) ? a.cover : a.photos?.[0] ?? null,
    count: a.photos?.length ?? 0,
    createdAt: a.createdAt ?? null,
  }))
}

export function buildTags(photos) {
  const counter = new Map()
  for (const p of photos) {
    for (const t of p.tags ?? []) counter.set(t, (counter.get(t) ?? 0) + 1)
  }
  return [...counter.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

export function applyAlbumMembership(albumCfg, photos) {
  const byPhoto = new Map(photos.map(p => [p.id, []]))
  for (const a of albumCfg) {
    for (const pid of a.photos ?? []) {
      byPhoto.get(pid)?.push(a.id)
    }
  }
  for (const p of photos) p.albums = byPhoto.get(p.id) ?? []
}

export async function writeManifest(dir, { photos, albums, tags }) {
  await fs.mkdir(dir, { recursive: true })
  await atomicWrite(path.join(dir, 'photos.json'), JSON.stringify(photos))
  await atomicWrite(path.join(dir, 'albums.json'), JSON.stringify(albums))
  await atomicWrite(path.join(dir, 'tags.json'), JSON.stringify(tags))
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
