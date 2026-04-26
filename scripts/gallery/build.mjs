// scripts/gallery/build.mjs
// 主入口: npm run gallery:build [-- --upload] [-- --dry-run]
import fs from 'node:fs/promises'
import path from 'node:path'
import { PATHS, R2, DERIVATIVES } from './config.mjs'
import { scanDirectory, contentHash } from './scan.mjs'
import { extractExif } from './exif.mjs'
import { generateDerivatives } from './derivatives.mjs'
import { encodeBlurhash } from './blurhash.mjs'
import {
  mergePhotos, buildAlbums, buildTags, applyAlbumMembership,
  writeManifest, readPhotosOrEmpty,
} from './manifest.mjs'
import { makeR2Client, uploadDerivatives } from './uploader.mjs'
import albumsConfig from './albums.config.mjs'

const argv = new Set(process.argv.slice(2))
const UPLOAD = argv.has('--upload')
const DRY = argv.has('--dry-run')

async function main() {
  const files = await scanDirectory(PATHS.staging)
  console.log(`[gallery] found ${files.length} source files`)
  if (files.length === 0) { console.log('[gallery] nothing to do'); return }

  const prev = await readPhotosOrEmpty(PATHS.manifestDir)
  const prevById = new Map(prev.map(p => [p.id, p]))
  const next = []

  for (const file of files) {
    const id = await contentHash(file)
    if (prevById.has(id) && !DRY) {
      next.push(prevById.get(id))           // 已处理过,沿用
      continue
    }
    console.log(`[gallery] ${id}  ${path.relative(PATHS.staging, file)}`)
    const meta = await extractExif(file)
    const src = await generateDerivatives(file, id, PATHS.derivatives)
    const blurhash = await encodeBlurhash(file)
    next.push({
      id,
      src,
      w: meta.w, h: meta.h,
      blurhash,
      title: null, desc: null,
      takenAt: meta.takenAt,
      exif: meta.exif,
      gps: meta.gps,
      albums: [],
      tags: [],
    })
  }

  const photos = mergePhotos(prev, next)
  applyAlbumMembership(albumsConfig, photos)
  const albums = buildAlbums(albumsConfig, photos)
  const tags = buildTags(photos)

  if (DRY) {
    console.log('[gallery] dry-run: skip writes/uploads')
    console.log(`  photos:${photos.length}  albums:${albums.length}  tags:${tags.length}`)
    return
  }

  await writeManifest(PATHS.manifestDir, { photos, albums, tags })
  console.log(`[gallery] manifest written -> ${PATHS.manifestDir}`)

  if (UPLOAD) {
    const client = makeR2Client()
    const items = []
    for (const p of photos) {
      for (const spec of DERIVATIVES) {
        for (const fmt of spec.formats) {
          const key = `${p.id}/${spec.name}.${fmt}`
          const abs = path.join(PATHS.derivatives, key)
          try {
            const body = await fs.readFile(abs)
            items.push({ key, body })
          } catch { /* 缺失则跳过 - 已上传过的没保留本地 */ }
        }
      }
    }
    console.log(`[gallery] uploading ${items.length} objects to R2 ...`)
    await uploadDerivatives(client, R2.bucket, PATHS.derivatives, items)
    console.log('[gallery] upload done')
  }
}

main().catch((e) => {
  console.error('[gallery] build failed:', e.message)
  if (/unknown photo id/.test(e.message)) {
    console.error('  hint: 检查 scripts/gallery/albums.config.mjs 中的 photo id 是否对应 photos.json 内已生成的 id')
  }
  process.exit(1)
})
