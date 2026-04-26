// scripts/gallery/__tests__/perf/frontend-perf.mjs
// 前端布局与筛选算法性能测试（Node 环境，无需浏览器）
import { performance } from 'node:perf_hooks'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import justifiedLayout from 'justified-layout'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MANIFEST_DIR = path.join(__dirname, '../../../../docs/.vuepress/public/gallery/data')

async function loadManifest() {
  const [photos, albums, tags] = await Promise.all([
    fs.readFile(path.join(MANIFEST_DIR, 'photos.json'), 'utf8').then(JSON.parse).catch(() => []),
    fs.readFile(path.join(MANIFEST_DIR, 'albums.json'), 'utf8').then(JSON.parse).catch(() => []),
    fs.readFile(path.join(MANIFEST_DIR, 'tags.json'), 'utf8').then(JSON.parse).catch(() => []),
  ])
  return { photos, albums, tags }
}

// 模拟 filterPhotos
function filterPhotos(photos, filter) {
  return photos.filter((p) => {
    if (filter.album && !p.albums?.includes(filter.album)) return false
    if (filter.tag && !p.tags?.includes(filter.tag)) return false
    return true
  })
}

// 模拟 JustifiedGrid 的 recompute
function computeLayout(photos, containerWidth = 1200, targetRowHeight = 240, gap = 6) {
  const sizes = photos.map(p => ({ width: p.w, height: p.h }))
  const layout = justifiedLayout(sizes, {
    containerWidth,
    targetRowHeight,
    boxSpacing: gap,
    containerPadding: 0,
  })

  // 按 top 分组成行（与 JustifiedGrid.vue 相同逻辑）
  const map = new Map()
  layout.boxes.forEach((b, i) => {
    const key = Math.round(b.top)
    const arr = map.get(key) ?? []
    arr.push({ photo: photos[i], width: b.width, height: b.height, left: b.left })
    map.set(key, arr)
  })
  const rows = [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, items]) => ({ height: Math.max(...items.map(it => it.height)), items }))

  return { layout, rows }
}

// ── 测试 justified-layout 性能 ──
function testLayoutPerf(photos, label) {
  console.log(`\n📐 Layout 性能测试 - ${label} (${photos.length} 张)`)

  const widths = [400, 800, 1200, 1600, 1920]
  for (const w of widths) {
    const times = []
    for (let i = 0; i < 10; i++) {
      const t0 = performance.now()
      computeLayout(photos, w)
      times.push(performance.now() - t0)
    }
    const avg = times.reduce((a, b) => a + b, 0) / times.length
    const min = Math.min(...times)
    const max = Math.max(...times)
    console.log(`  宽度 ${w}px:  avg=${avg.toFixed(2)}ms  min=${min.toFixed(2)}ms  max=${max.toFixed(2)}ms`)
  }

  // 不同目标行高
  const heights = [160, 240, 320, 480]
  console.log(`  --`)
  for (const h of heights) {
    const t0 = performance.now()
    for (let i = 0; i < 10; i++) computeLayout(photos, 1200, h)
    const avg = (performance.now() - t0) / 10
    console.log(`  行高 ${h}px: avg=${avg.toFixed(2)}ms`)
  }
}

// ── 测试筛选性能 ──
function testFilterPerf(photos, tags, albums) {
  console.log(`\n🔍 筛选性能测试 (${photos.length} 张)`)

  // Tag 筛选
  for (const tag of tags.slice(0, 5)) {
    const times = []
    for (let i = 0; i < 100; i++) {
      const t0 = performance.now()
      filterPhotos(photos, { tag: tag.name })
      times.push(performance.now() - t0)
    }
    const avg = times.reduce((a, b) => a + b, 0) / times.length
    console.log(`  tag "${tag.name}": ${avg.toFixed(3)}ms (${tag.count} 张匹配)`)
  }

  // Album 筛选
  for (const album of albums.filter(a => a.count > 0)) {
    const times = []
    for (let i = 0; i < 100; i++) {
      const t0 = performance.now()
      filterPhotos(photos, { album: album.id })
      times.push(performance.now() - t0)
    }
    const avg = times.reduce((a, b) => a + b, 0) / times.length
    console.log(`  album "${album.title}": ${avg.toFixed(3)}ms (${album.count} 张匹配)`)
  }

  // 组合筛选（不存在的组合）
  const t0 = performance.now()
  for (let i = 0; i < 1000; i++) filterPhotos(photos, { tag: '不存在的标签' })
  const avg = (performance.now() - t0) / 1000
  console.log(`  无匹配筛选: ${avg.toFixed(3)}ms`)
}

// ── 测试大数据量下的表现 ──
function testScalePerf(basePhotos) {
  console.log(`\n📈 规模扩展测试`)

  const scales = [10, 50, 100, 500, 1000]
  for (const n of scales) {
    if (n > basePhotos.length) {
      // 复制照片数据达到目标数量
      const scaled = []
      for (let i = 0; i < n; i++) {
        const p = basePhotos[i % basePhotos.length]
        scaled.push({ ...p, id: `${p.id}_dup${i}` })
      }
      basePhotos = scaled
    }

    const subset = basePhotos.slice(0, n)

    // Layout
    const tLayout0 = performance.now()
    computeLayout(subset, 1200)
    const layoutTime = performance.now() - tLayout0

    // Filter
    const tFilter0 = performance.now()
    for (let i = 0; i < 100; i++) filterPhotos(subset, { tag: subset[0]?.tags?.[0] })
    const filterTime = (performance.now() - tFilter0) / 100

    // Memory
    const mem = process.memoryUsage()

    console.log(`  ${String(n).padStart(4)} 张: layout=${layoutTime.toFixed(2)}ms  filter=${filterTime.toFixed(3)}ms  heap=${Math.round(mem.heapUsed / 1024 / 1024)}MB`)
  }
}

// ── 主流程 ──
async function main() {
  console.log('[frontend-perf] 加载 manifest...')
  const { photos, albums, tags } = await loadManifest()

  if (photos.length === 0) {
    console.log('[frontend-perf] 未找到 manifest，请先运行 run.mjs 生成测试数据')
    process.exit(1)
  }

  console.log(`[frontend-perf] 加载完成: ${photos.length} 张照片, ${albums.length} 个专辑, ${tags.length} 个标签`)

  // 1. 全量布局测试
  testLayoutPerf(photos, '全量照片')

  // 2. 筛选性能测试
  testFilterPerf(photos, tags, albums)

  // 3. 规模扩展测试
  testScalePerf(photos)

  console.log('\n✅ 前端性能测试完成')
}

main().catch(e => {
  console.error('[frontend-perf] 错误:', e)
  process.exit(1)
})
