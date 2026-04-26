// scripts/gallery/__tests__/perf/build-with-tags.mjs
// 包装 build 流程：从目录结构提取 tag，支持动态 album 分配
import fs from 'node:fs/promises'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import { PATHS, DERIVATIVES } from '../../config.mjs'
import { scanDirectory, contentHash } from '../../scan.mjs'
import { extractExif } from '../../exif.mjs'
import { generateDerivatives } from '../../derivatives.mjs'
import { encodeBlurhash } from '../../blurhash.mjs'
import {
  mergePhotos, buildTags, writeManifest, readPhotosOrEmpty,
} from '../../manifest.mjs'
import { extractTagsFromPath } from './generate-fixtures.mjs'

export async function buildWithTags(stagingDir, options = {}) {
  const {
    dryRun = false,
    albumAssignments = [], // [{ id, title, desc, photoIds, cover? }]
  } = options

  const t0 = performance.now()
  const mem0 = process.memoryUsage()

  // 1. 扫描
  const tScan0 = performance.now()
  const files = await scanDirectory(stagingDir)
  const scanTime = performance.now() - tScan0

  console.log(`[perf-build] found ${files.length} source files`)
  if (files.length === 0) return { photos: [], albums: [], tags: [], metrics: {} }

  // 2. 读取已有的 manifest 和 meta.json
  const prev = await readPhotosOrEmpty(PATHS.manifestDir)
  const prevById = new Map(prev.map(p => [p.id, p]))

  let fileMetaMap = new Map()
  try {
    const metaRaw = await fs.readFile(path.join(stagingDir, 'meta.json'), 'utf8')
    const metaArr = JSON.parse(metaRaw)
    for (const m of metaArr) fileMetaMap.set(m.path, m)
  } catch { /* meta.json 不存在则忽略 */ }

  const next = []

  // 记录 file -> tags 映射
  const fileTagsMap = new Map()

  // 3. 处理每张图片
  let exifTime = 0
  let derivTime = 0
  let blurhashTime = 0

  for (const file of files) {
    const tags = extractTagsFromPath(file, stagingDir)
    fileTagsMap.set(file, tags)

    const id = await contentHash(file)
    if (prevById.has(id) && !dryRun) {
      const p = { ...prevById.get(id), tags }
      next.push(p)
      continue
    }

    const tExif0 = performance.now()
    const meta = await extractExif(file)
    exifTime += performance.now() - tExif0

    const tDeriv0 = performance.now()
    const src = await generateDerivatives(file, id, PATHS.derivatives)
    derivTime += performance.now() - tDeriv0

    const tBlur0 = performance.now()
    const blurhash = await encodeBlurhash(file)
    blurhashTime += performance.now() - tBlur0

    // 从 meta.json 读取标题和描述
    const fileMeta = fileMetaMap.get(file)

    next.push({
      id,
      src,
      w: meta.w, h: meta.h,
      blurhash,
      title: fileMeta?.title ?? null,
      desc: fileMeta?.desc ?? null,
      takenAt: meta.takenAt,
      exif: meta.exif,
      gps: meta.gps,
      albums: [],
      tags,
    })
  }

  // 4. 合并并应用 album
  const photos = mergePhotos(prev, next)

  // 应用 album 分配
  for (const p of photos) {
    p.albums = []
  }
  const albums = albumAssignments.map(a => {
    for (const pid of a.photoIds ?? []) {
      const photo = photos.find(p => p.id === pid)
      if (photo) photo.albums.push(a.id)
    }
    return {
      id: a.id,
      title: a.title,
      desc: a.desc ?? '',
      cover: a.cover ?? a.photoIds?.[0] ?? null,
      count: a.photoIds?.length ?? 0,
      createdAt: a.createdAt ?? new Date().toISOString(),
    }
  })

  const tags = buildTags(photos)

  const tBuild = performance.now() - t0
  const mem1 = process.memoryUsage()

  if (!dryRun) {
    await writeManifest(PATHS.manifestDir, { photos, albums, tags })
  }

  return {
    photos,
    albums,
    tags,
    metrics: {
      totalTime: Math.round(tBuild),
      scanTime: Math.round(scanTime),
      exifTime: Math.round(exifTime),
      derivTime: Math.round(derivTime),
      blurhashTime: Math.round(blurhashTime),
      photosCount: photos.length,
      albumsCount: albums.length,
      tagsCount: tags.length,
      memUsedMB: Math.round((mem1.heapUsed - mem0.heapUsed) / 1024 / 1024),
      memPeakMB: Math.round(mem1.heapUsed / 1024 / 1024),
    },
  }
}
