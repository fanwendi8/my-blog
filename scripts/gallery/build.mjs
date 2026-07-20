// scripts/gallery/build.mjs
// 主入口: npm run gallery:build [-- --upload] [-- --dry-run]
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { PATHS, R2, PHOTO_DERIVATIVES } from './config.mjs'
import { contentHash } from './scan.mjs'
import { derivativeManifest, generateDerivatives } from './derivatives.mjs'
import {
  mergePhotos, writeManifest, readPhotosOrEmpty,
} from './manifest.mjs'
import { makeR2Client, uploadDerivatives } from './uploader.mjs'
import { prefixedObjectKey } from './sync.mjs'
import { scanStorySources } from './storySources.mjs'

const argv = new Set(process.argv.slice(2))
const UPLOAD = argv.has('--upload')
const DRY = argv.has('--dry-run')

export function fileMetaKey(file, stagingRoot = PATHS.staging) {
  const normalized = file.replaceAll('\\', '/')
  if (!path.isAbsolute(file)) return normalized.replace(/^\/+/, '')
  return path.relative(stagingRoot, file).replaceAll('\\', '/')
}

export function createPhotoRecord({
  id, src, size, fileMeta = {}, previous = null, storySlug, storyOrder, isCover,
}) {
  return {
    id,
    src,
    w: previous?.w ?? size.w,
    h: previous?.h ?? size.h,
    title: fileMeta.title ?? previous?.title ?? null,
    alt: fileMeta.alt ?? previous?.alt ?? previous?.title ?? '',
    caption: fileMeta.caption ?? previous?.caption ?? null,
    ...(storySlug === undefined ? {} : { storySlug, storyOrder, isCover }),
  }
}

async function readImageSize(file) {
  const { width, height } = await sharp(file).metadata()
  return { w: width, h: height }
}

async function pruneStalePhotos(outRoot, keepIds) {
  await fs.mkdir(outRoot, { recursive: true })
  const entries = await fs.readdir(outRoot, { withFileTypes: true })
  await Promise.all(entries
    .filter(entry => {
      if (entry.isDirectory()) return true
      const match = entry.name.match(/^([a-f0-9]+)-/)
      return match && !keepIds.has(match[1])
    })
    .map(entry => fs.rm(path.join(outRoot, entry.name), { recursive: true, force: true })))
}

async function main() {
  const stories = await scanStorySources(PATHS.staging)
  const allFiles = stories.flatMap(({ slug, photos }) => photos.map(({
    file, storyOrder, isCover,
  }) => ({ file, storySlug: slug, storyOrder, isCover })))

  console.log(`[gallery] found ${stories.length} story directories, ${allFiles.length} photos`)
  if (allFiles.length === 0) { console.log('[gallery] nothing to do'); return }

  const prev = await readPhotosOrEmpty(PATHS.manifestDir)
  const prevById = new Map(prev.map(p => [p.id, p]))

  // 读取 meta.json（如果存在）
  let fileMetaMap = new Map()
  try {
    const metaRaw = await fs.readFile(path.join(PATHS.staging, 'meta.json'), 'utf8')
    const metaArr = JSON.parse(metaRaw)
    for (const m of metaArr) fileMetaMap.set(fileMetaKey(m.path), m)
  } catch { /* meta.json 不存在则忽略 */ }

  const next = []

  for (const { file, storySlug, storyOrder, isCover } of allFiles) {
    const id = await contentHash(file)

    if (prevById.has(id) && !DRY) {
      await generateDerivatives(file, id, PATHS.publicImages, PHOTO_DERIVATIVES)
      const prevPhoto = prevById.get(id)
      next.push(createPhotoRecord({
        id,
        src: derivativeManifest(id, PHOTO_DERIVATIVES),
        size: prevPhoto,
        previous: prevPhoto,
        storySlug,
        storyOrder,
        isCover,
      }))
      continue
    }
    console.log(`[gallery] ${id}  ${path.relative(PATHS.staging, file)}`)
    const src = await generateDerivatives(file, id, PATHS.publicImages, PHOTO_DERIVATIVES)
    const size = await readImageSize(file)

    // 从 meta.json 读取轻量标题和配文
    const fileMeta = fileMetaMap.get(fileMetaKey(file))

    next.push(createPhotoRecord({
      id,
      src,
      size,
      fileMeta,
      storySlug,
      storyOrder,
      isCover,
    }))
  }

  // 只保留当前存在的文件对应的照片（清理已删除的文件）
  const nextIds = new Set(next.map(p => p.id))
  const prevFiltered = prev.filter(p => nextIds.has(p.id))
  const photos = mergePhotos(prevFiltered, next)

  if (DRY) {
    console.log('[gallery] dry-run: skip writes/uploads')
    console.log(`  photos:${photos.length}`)
    return
  }

  await writeManifest(PATHS.manifestDir, { photos })
  await pruneStalePhotos(PATHS.publicImages, new Set(photos.map(photo => photo.id)))
  console.log(`[gallery] manifest written -> ${PATHS.manifestDir}`)

  if (UPLOAD) {
    const client = makeR2Client()
    const items = []
    for (const p of photos) {
      if (typeof p.src === 'string') continue
      for (const variant of Object.values(p.src)) {
        if (typeof variant === 'string') continue
        for (const [fmt, relPath] of Object.entries(variant)) {
          if (fmt === 'w' || typeof relPath !== 'string') continue
          const abs = path.join(PATHS.publicImages, relPath)
          try {
            const body = await fs.readFile(abs)
            items.push({ key: prefixedObjectKey(R2.keyPrefix, relPath), body })
          } catch { /* 缺失则跳过 - 已上传过的没保留本地 */ }
        }
      }
    }
    console.log(`[gallery] uploading ${items.length} objects to R2 ...`)
    await uploadDerivatives(client, R2.bucket, PATHS.publicImages, items)
    console.log('[gallery] upload done')
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((e) => {
    console.error('[gallery] build failed:', e.message)
    process.exit(1)
  })
}
