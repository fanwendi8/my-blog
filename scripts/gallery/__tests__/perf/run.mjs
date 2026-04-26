// scripts/gallery/__tests__/perf/run.mjs
// Gallery 性能与功能综合测试主入口
// 用法: node scripts/gallery/__tests__/perf/run.mjs [每场景图片数=5]
import fs from 'node:fs/promises'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'
import { generateFixtures, extractTagsFromPath } from './generate-fixtures.mjs'
import { buildWithTags } from './build-with-tags.mjs'
import { writeManifest, readPhotosOrEmpty } from '../../manifest.mjs'
import { PATHS } from '../../config.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STAGING = path.join(__dirname, 'gallery-staging-perf')

const countPerScene = parseInt(process.argv[2]) || 5

// ── Album 分配规则（基于 tag 和索引）──
function assignAlbums(photos) {
  const albums = []

  // 规则1: "2024 精选" - 每个场景取前2张
  const featured = []
  const byScene = new Map()
  for (const p of photos) {
    const scene = p.tags[0] ?? '未分类'
    if (!byScene.has(scene)) byScene.set(scene, [])
    byScene.get(scene).push(p.id)
  }
  for (const [, ids] of byScene) {
    featured.push(...ids.slice(0, 2))
  }
  albums.push({
    id: 'featured-2024',
    title: '2024 精选',
    desc: '每个场景精选代表作品',
    photoIds: featured,
  })

  // 规则2: "城市漫步" - 所有带 "城市" tag 的
  albums.push({
    id: 'city-walk',
    title: '城市漫步',
    desc: '城市街拍与夜景合集',
    photoIds: photos.filter(p => p.tags.includes('城市')).map(p => p.id),
  })

  // 规则3: "自然之美" - 风景 + 动物
  albums.push({
    id: 'nature',
    title: '自然之美',
    desc: '风景与野生动物',
    photoIds: photos.filter(p => p.tags.includes('风景') || p.tags.includes('动物')).map(p => p.id),
  })

  // 规则4: "黑白世界" - 人像/黑白
  albums.push({
    id: 'mono',
    title: '黑白世界',
    desc: '黑白摄影作品集',
    photoIds: photos.filter(p => p.tags.includes('人像') && p.tags.includes('黑白')).map(p => p.id),
  })

  // 规则5: "光影实验" - 小合集，建筑类前几张
  albums.push({
    id: 'light-exp',
    title: '光影实验',
    desc: '建筑光影探索',
    photoIds: photos.filter(p => p.tags.includes('建筑')).slice(0, 5).map(p => p.id),
  })

  // 规则6: "空专辑测试" - 验证空专辑处理
  albums.push({
    id: 'empty-test',
    title: '空专辑',
    desc: '用于测试空状态展示',
    photoIds: [],
  })

  return albums
}

// ── 验证逻辑 ──
function validate({ photos, albums, tags }) {
  const errors = []

  // 1. 每张照片必须有 id, src, w, h, blurhash, takenAt
  for (const p of photos) {
    if (!p.id || typeof p.id !== 'string') errors.push(`photo missing id`)
    if (!p.src?.thumb) errors.push(`photo ${p.id} missing thumb`)
    if (typeof p.w !== 'number' || p.w <= 0) errors.push(`photo ${p.id} invalid width: ${p.w}`)
    if (typeof p.h !== 'number' || p.h <= 0) errors.push(`photo ${p.id} invalid height: ${p.h}`)
    if (!p.blurhash) errors.push(`photo ${p.id} missing blurhash`)
    if (!p.takenAt) errors.push(`photo ${p.id} missing takenAt`)
  }

  // 2. 专辑引用的 photo id 必须存在
  const photoIds = new Set(photos.map(p => p.id))
  for (const a of albums) {
    for (const pid of a.photoIds ?? []) {
      if (!photoIds.has(pid)) errors.push(`album "${a.id}" references unknown photo: ${pid}`)
    }
  }

  // 3. tag 统计必须一致
  const tagCounter = new Map()
  for (const p of photos) {
    for (const t of p.tags ?? []) tagCounter.set(t, (tagCounter.get(t) ?? 0) + 1)
  }
  for (const t of tags) {
    const expected = tagCounter.get(t.name) ?? 0
    if (t.count !== expected) errors.push(`tag "${t.name}" count mismatch: ${t.count} vs ${expected}`)
  }

  // 4. album count 必须一致
  for (const a of albums) {
    const actual = photos.filter(p => p.albums?.includes(a.id)).length
    if (a.count !== actual) errors.push(`album "${a.id}" count mismatch: ${a.count} vs ${actual}`)
  }

  // 5. 检测重复 id
  const idCounts = new Map()
  for (const p of photos) idCounts.set(p.id, (idCounts.get(p.id) ?? 0) + 1)
  for (const [id, count] of idCounts) {
    if (count > 1) errors.push(`duplicate photo id: ${id} (${count} times)`)
  }

  return errors
}

// ── 报告生成 ──
function printReport({ photos, albums, tags, metrics }) {
  console.log('\n' + '='.repeat(60))
  console.log('  Gallery 性能测试报告')
  console.log('='.repeat(60))

  console.log('\n📊 数据规模')
  console.log(`  照片总数:    ${photos.length}`)
  console.log(`  专辑总数:    ${albums.length}`)
  console.log(`  标签总数:    ${tags.length}`)

  console.log('\n⏱️  构建耗时')
  console.log(`  总耗时:      ${metrics.totalTime}ms`)
  console.log(`  扫描文件:    ${metrics.scanTime}ms`)
  console.log(`  EXIF 提取:   ${metrics.exifTime}ms`)
  console.log(`  衍生图生成:  ${metrics.derivTime}ms`)
  console.log(`  Blurhash:    ${metrics.blurhashTime}ms`)

  console.log('\n💾 内存使用')
  console.log(`  增量:        ${metrics.memUsedMB} MB`)
  console.log(`  峰值:        ${metrics.memPeakMB} MB`)

  console.log('\n🏷️  标签分布')
  const sortedTags = [...tags].sort((a, b) => b.count - a.count)
  for (const t of sortedTags.slice(0, 10)) {
    console.log(`  ${t.name.padEnd(12)} ${String(t.count).padStart(3)} 张`)
  }
  if (tags.length > 10) console.log(`  ... 还有 ${tags.length - 10} 个标签`)

  console.log('\n📁 专辑分布')
  for (const a of albums) {
    console.log(`  ${a.title.padEnd(14)} ${String(a.count).padStart(3)} 张  ${a.count === 0 ? '(空)' : ''}`)
  }

  console.log('\n📐 尺寸分布')
  const ratios = new Map()
  for (const p of photos) {
    const r = p.w / p.h
    const name = r > 1.3 ? '横版' : r < 0.77 ? '竖版' : '方形'
    ratios.set(name, (ratios.get(name) ?? 0) + 1)
  }
  for (const [name, count] of ratios) {
    console.log(`  ${name.padEnd(6)} ${count} 张`)
  }

  console.log('\n📈 单张平均耗时')
  if (photos.length > 0) {
    console.log(`  EXIF:    ${(metrics.exifTime / photos.length).toFixed(1)}ms`)
    console.log(`  衍生图:  ${(metrics.derivTime / photos.length).toFixed(1)}ms`)
    console.log(`  Blurhash: ${(metrics.blurhashTime / photos.length).toFixed(1)}ms`)
    console.log(`  总计:    ${(metrics.totalTime / photos.length).toFixed(1)}ms`)
  }

  console.log('\n' + '='.repeat(60))
}

// ── 主流程 ──
async function main() {
  console.log(`[perf] Gallery 综合测试开始 (每场景 ${countPerScene} 张)`)

  // 1. 清理旧数据
  console.log('[perf] 清理缓存...')
  await fs.rm(PATHS.derivatives, { recursive: true }).catch(() => {})
  await fs.rm(PATHS.manifestDir, { recursive: true }).catch(() => {})
  await fs.rm(STAGING, { recursive: true }).catch(() => {})

  // 2. 生成测试图片
  const { files, stagingDir } = await generateFixtures(countPerScene)
  console.log(`[perf] 已生成 ${files.length} 张测试图片`)

  // 3. 第一轮 build：生成照片（无 album）
  console.log('[perf] 执行构建...')
  const result = await buildWithTags(stagingDir, { dryRun: false, albumAssignments: [] })

  // 4. 分配 album
  console.log('[perf] 分配专辑...')
  const albumAssignments = assignAlbums(result.photos)

  // 5. 第二轮：应用 album 并写回 manifest
  const photos = result.photos.map(p => ({ ...p, albums: [] }))
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
  const tags = buildTagsFromPhotos(photos)

  await writeManifest(PATHS.manifestDir, { photos, albums, tags })

  // 6. 验证
  console.log('[perf] 验证数据完整性...')
  const errors = validate({ photos, albums, tags })
  if (errors.length > 0) {
    console.error('[perf] ❌ 验证失败:')
    errors.forEach(e => console.error('  -', e))
    process.exit(1)
  }
  console.log('[perf] ✅ 验证通过')

  // 7. 报告
  printReport({ photos, albums, tags, metrics: result.metrics })

  // 8. 输出 manifest 路径
  console.log(`\n📂 Manifest 输出: ${PATHS.manifestDir}`)
  console.log(`   photos.json:  ${photos.length} 条记录`)
  console.log(`   albums.json:  ${albums.length} 条记录`)
  console.log(`   tags.json:    ${tags.length} 条记录`)

  return { photos, albums, tags, metrics: result.metrics }
}

function buildTagsFromPhotos(photos) {
  const counter = new Map()
  for (const p of photos) {
    for (const t of p.tags ?? []) counter.set(t, (counter.get(t) ?? 0) + 1)
  }
  return [...counter.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

main().catch(e => {
  console.error('[perf] 测试失败:', e)
  process.exit(1)
})
