// scripts/gallery/__tests__/perf/generate-fixtures.mjs
// 生成带 EXIF、标题、描述的多样化测试图片
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import piexif from 'piexifjs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STAGING = path.join(__dirname, 'gallery-staging-perf')

// 场景定义: [目录路径, 基础颜色, 常见比例, 相机配置]
const SCENES = [
  {
    dir: '风景/日落', color: '#E85D04', ratios: ['3:2', '16:9', '2:3'],
    gear: { make: 'Canon', model: 'EOS R5', lens: 'RF 24-70mm F2.8L IS USM', flMin: 24, flMax: 70, fnMin: 80, fnMax: 110, isoMin: 100, isoMax: 400, expMin: 1, expMax: 30 },
    titles: [' golden hour', '暮光之城', '夕阳余晖', '火烧云', '最后一缕光'],
    descs: ['日落时分的温暖色调', '天空被染成橙红色', '海平面上的落日', '云层中的金色光芒', '暮色渐浓的时刻']
  },
  {
    dir: '风景/海边', color: '#0077B6', ratios: ['3:2', '16:9', '2:3'],
    gear: { make: 'Sony', model: 'A7R V', lens: 'FE 16-35mm F2.8 GM', flMin: 16, flMax: 35, fnMin: 80, fnMax: 130, isoMin: 100, isoMax: 400, expMin: 1, expMax: 60 },
    titles: ['海浪拍岸', '蓝色时刻', '潮汐之间', '海岸线', '浪花飞溅'],
    descs: ['海浪轻抚沙滩', '清晨的海边宁静', '潮水退去后的痕迹', '一望无际的蔚蓝', '浪花中的光影']
  },
  {
    dir: '风景/山脉', color: '#6A994E', ratios: ['3:2', '16:9', '1:1'],
    gear: { make: 'Nikon', model: 'Z8', lens: 'NIKKOR Z 14-24mm F2.8 S', flMin: 14, flMax: 24, fnMin: 80, fnMax: 160, isoMin: 100, isoMax: 800, expMin: 1, expMax: 125 },
    titles: ['云海之上', '山巅日出', '层峦叠嶂', '云雾缭绕', '群山剪影'],
    descs: ['高山之巅的壮阔', '云海翻涌的奇观', '日出时分的山峰', '层叠的山峦曲线', '云雾中的神秘感']
  },
  {
    dir: '城市/街拍', color: '#9D4EDD', ratios: ['2:3', '3:2', '1:1'],
    gear: { make: 'Fujifilm', model: 'X-T5', lens: 'XF 35mm F1.4 R', flMin: 35, flMax: 35, fnMin: 14, fnMax: 56, isoMin: 200, isoMax: 1600, expMin: 60, expMax: 500 },
    titles: ['街头巷尾', '城市脉搏', '行人匆匆', '街角故事', '光影交错'],
    descs: ['街头的瞬间捕捉', '城市生活的切片', '光影中的行人', '街角的独特视角', '都市节奏的凝固']
  },
  {
    dir: '城市/夜景', color: '#3C096C', ratios: ['16:9', '3:2'],
    gear: { make: 'Sony', model: 'A7S III', lens: 'FE 24mm F1.4 GM', flMin: 24, flMax: 24, fnMin: 14, fnMax: 28, isoMin: 800, isoMax: 6400, expMin: 8, expMax: 30 },
    titles: ['霓虹闪烁', '城市不眠', '夜色阑珊', '灯火通明', '午夜街头'],
    descs: ['城市夜晚的灯光', '霓虹招牌的倒影', '车水马龙的光轨', '深夜的静谧街景', '灯火阑珊处']
  },
  {
    dir: '人像/室内', color: '#FF006E', ratios: ['2:3', '3:2'],
    gear: { make: 'Canon', model: 'EOS R6 Mark II', lens: 'RF 85mm F1.2L USM', flMin: 85, flMax: 85, fnMin: 12, fnMax: 28, isoMin: 400, isoMax: 3200, expMin: 60, expMax: 250 },
    titles: ['窗边的光', '室内一隅', '柔和光影', '静谧时刻', '温暖色调'],
    descs: ['自然光下的人像', '室内柔和的氛围', '窗边洒落的阳光', '安静的一隅空间', '温暖的室内色调']
  },
  {
    dir: '人像/黑白', color: '#6C757D', ratios: ['2:3', '1:1', '3:2'],
    gear: { make: 'Leica', model: 'M11 Monochrom', lens: 'Summilux-M 50mm F1.4 ASPH.', flMin: 50, flMax: 50, fnMin: 14, fnMax: 80, isoMin: 200, isoMax: 3200, expMin: 60, expMax: 500 },
    titles: ['黑白印象', '光影人像', '灰度世界', '轮廓之美', '明与暗'],
    descs: ['褪去色彩的纯粹', '光影勾勒的轮廓', '黑白之间的层次', '灰度中的情感', '明暗对比的力量']
  },
  {
    dir: '建筑/现代', color: '#023E8A', ratios: ['2:3', '9:16', '3:2'],
    gear: { make: 'Sony', model: 'A7R V', lens: 'FE 12-24mm F2.8 GM', flMin: 12, flMax: 24, fnMin: 80, fnMax: 130, isoMin: 100, isoMax: 400, expMin: 1, expMax: 60 },
    titles: ['几何之美', '线条构成', '玻璃幕墙', '摩天大楼', '现代极简'],
    descs: ['现代建筑的线条', '玻璃反射的天空', '几何构成的画面', '极简的建筑美学', '钢铁与玻璃的对话']
  },
  {
    dir: '建筑/古典', color: '#B08968', ratios: ['2:3', '1:1', '3:2'],
    gear: { make: 'Hasselblad', model: 'X2D 100C', lens: 'XCD 45mm F4 P', flMin: 45, flMax: 45, fnMin: 56, fnMax: 110, isoMin: 100, isoMax: 400, expMin: 1, expMax: 125 },
    titles: ['时光痕迹', '古典韵味', '雕花细节', '历史建筑', '岁月沉淀'],
    descs: ['古典建筑的细节', '岁月留下的痕迹', '精美的雕花工艺', '历史建筑的庄重', '时光凝固的瞬间']
  },
  {
    dir: '动物/野生', color: '#D62828', ratios: ['3:2', '1:1', '2:3'],
    gear: { make: 'Nikon', model: 'Z9', lens: 'NIKKOR Z 400mm F2.8 TC VR S', flMin: 400, flMax: 400, fnMin: 28, fnMax: 80, isoMin: 400, isoMax: 3200, expMin: 500, expMax: 2000 },
    titles: ['野外追踪', '眼神交汇', '自然精灵', '捕食瞬间', '栖息地'],
    descs: ['野生动物的凝视', '自然中的灵动瞬间', '捕食者的专注', '栖息地的一隅', '生态链上的角色']
  },
  {
    dir: '动物/宠物', color: '#F77F00', ratios: ['1:1', '3:2', '2:3'],
    gear: { make: 'Fujifilm', model: 'X-T5', lens: 'XF 56mm F1.2 R', flMin: 56, flMax: 56, fnMin: 12, fnMax: 28, isoMin: 400, isoMax: 1600, expMin: 125, expMax: 500 },
    titles: ['慵懒午后', '萌态百出', '陪伴时光', '好奇眼神', '温馨时刻'],
    descs: ['宠物的慵懒姿态', '萌萌的表情瞬间', '与主人的温馨时刻', '好奇探索的眼神', '午后阳光下的惬意']
  },
]

const RATIO_SIZES = {
  '3:2':  [1800, 1200],
  '2:3':  [1200, 1800],
  '16:9': [1920, 1080],
  '9:16': [1080, 1920],
  '1:1':  [1500, 1500],
}

function svgText(text, w, h, color) {
  const textColor = isLight(color) ? '#000' : '#fff'
  return Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${color}" />
    <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle"
      font-family="sans-serif" font-size="${Math.min(w, h) / 10}" fill="${textColor}" opacity="0.7">
      ${escapeXml(text)}
    </text>
    <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle"
      font-family="sans-serif" font-size="${Math.min(w, h) / 20}" fill="${textColor}" opacity="0.5">
      ${w} x ${h}
    </text>
  </svg>`)
}

function escapeXml(str) {
  return str.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]))
}

function isLight(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 0.299 + g * 0.587 + b * 0.114) > 128
}

function varyColor(hex, index) {
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(1, 3), 16) + (index % 5 - 2) * 8))
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(3, 5), 16) + (index % 7 - 3) * 6))
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(5, 7), 16) + (index % 3 - 1) * 10))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// 生成随机拍摄参数
function randomParam(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function formatExposureTime(denominator) {
  // denominator 是快门速度的分母，如 125 表示 1/125s
  return `1/${denominator}`
}

// 生成随机 GPS 坐标（围绕某个中心点小幅偏移）
function randomGPS(baseLat, baseLon, index) {
  const lat = baseLat + (Math.sin(index * 1.3) * 0.5)
  const lon = baseLon + (Math.cos(index * 0.7) * 0.5)
  return { lat, lon }
}

function degToDMS(deg) {
  const d = Math.floor(Math.abs(deg))
  const m = Math.floor((Math.abs(deg) - d) * 60)
  const s = Math.round(((Math.abs(deg) - d) * 60 - m) * 60 * 100) / 100
  return [[d, 1], [m, 1], [Math.round(s * 100), 100]]
}

// 为每个场景生成不同的 GPS 中心点
const GPS_BASES = {
  '风景/日落': { lat: 35.0, lon: 139.0 },   // 日本海岸
  '风景/海边': { lat: 24.0, lon: 118.0 },   // 厦门
  '风景/山脉': { lat: 30.0, lon: 103.0 },   // 川西
  '城市/街拍': { lat: 31.2, lon: 121.5 },   // 上海
  '城市/夜景': { lat: 22.3, lon: 114.2 },   // 香港
  '人像/室内': { lat: 39.9, lon: 116.4 },   // 北京
  '人像/黑白': { lat: 48.9, lon: 2.3 },     // 巴黎
  '建筑/现代': { lat: 25.0, lon: 55.3 },    // 迪拜
  '建筑/古典': { lat: 41.9, lon: 12.5 },    // 罗马
  '动物/野生': { lat: -1.3, lon: 36.8 },    // 肯尼亚
  '动物/宠物': { lat: 51.5, lon: -0.1 },    // 伦敦
}

export async function generateFixtures(countPerScene = 5) {
  console.log(`[perf] generating fixtures -> ${STAGING}`)
  await fs.rm(STAGING, { recursive: true }).catch(() => {})

  const files = []
  const meta = []  // 存储 title, desc, exif 等元数据
  let globalIndex = 0

  for (const scene of SCENES) {
    const dir = path.join(STAGING, scene.dir)
    await fs.mkdir(dir, { recursive: true })
    const gpsBase = GPS_BASES[scene.dir]

    for (let i = 0; i < countPerScene; i++) {
      const ratio = scene.ratios[i % scene.ratios.length]
      const [baseW, baseH] = RATIO_SIZES[ratio]
      const w = baseW + (i % 3 - 1) * 100
      const h = baseH + (i % 5 - 2) * 80
      const color = varyColor(scene.color, i)
      const filename = `${String(globalIndex + 1).padStart(3, '0')}_${scene.dir.replace(/\//g, '-')}_${ratio.replace(':', 'x')}.jpg`
      const filepath = path.join(dir, filename)

      // 生成随机拍摄参数
      const fl = randomParam(scene.gear.flMin, scene.gear.flMax)
      const fnVal = randomParam(scene.gear.fnMin, scene.gear.fnMax)
      const iso = randomParam(scene.gear.isoMin, scene.gear.isoMax)
      const expDenom = randomParam(scene.gear.expMin, scene.gear.expMax)
      const gps = randomGPS(gpsBase.lat, gpsBase.lon, globalIndex)

      // 日期：2024 年内随机日期
      const date = new Date(2024, 0, 1 + Math.floor(Math.random() * 365))
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ':')
      const timeStr = `${String(6 + Math.floor(Math.random() * 14)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
      const dateTimeStr = `${dateStr} ${timeStr}`

      // 生成 EXIF
      const exifObj = {
        '0th': {
          [piexif.ImageIFD.Make]: scene.gear.make,
          [piexif.ImageIFD.Model]: scene.gear.model,
          [piexif.ImageIFD.DateTime]: dateTimeStr,
        },
        'Exif': {
          [piexif.ExifIFD.FNumber]: [fnVal, 10],
          [piexif.ExifIFD.ExposureTime]: [1, expDenom],
          [piexif.ExifIFD.ISOSpeedRatings]: iso,
          [piexif.ExifIFD.FocalLength]: [fl * 10, 10],
          [piexif.ExifIFD.LensModel]: scene.gear.lens,
          [piexif.ExifIFD.DateTimeOriginal]: dateTimeStr,
        },
        'GPS': {
          [piexif.GPSIFD.GPSLatitudeRef]: gps.lat >= 0 ? 'N' : 'S',
          [piexif.GPSIFD.GPSLatitude]: degToDMS(gps.lat),
          [piexif.GPSIFD.GPSLongitudeRef]: gps.lon >= 0 ? 'E' : 'W',
          [piexif.GPSIFD.GPSLongitude]: degToDMS(gps.lon),
        }
      }

      // 生成图片
      const svg = svgText(scene.dir, w, h, color)
      const jpegBuf = await sharp(svg).jpeg({ quality: 85, mozjpeg: true }).toBuffer()
      const exifBytes = piexif.dump(exifObj)
      const newJpeg = piexif.insert(exifBytes, jpegBuf.toString('binary'))
      await fs.writeFile(filepath, Buffer.from(newJpeg, 'binary'))

      // 记录元数据
      const title = scene.titles[i % scene.titles.length]
      const desc = scene.descs[i % scene.descs.length]
      meta.push({
        path: filepath,
        title,
        desc,
        exif: {
          camera: `${scene.gear.make} ${scene.gear.model}`,
          lens: scene.gear.lens,
          fl,
          fn: fnVal / 10,
          iso,
          exp: formatExposureTime(expDenom),
          takenAt: dateTimeStr,
          gps,
        }
      })

      files.push({ path: filepath, dir: scene.dir, ratio, w, h, color, title, desc })
      globalIndex++
    }
  }

  // 写入 meta.json
  const metaPath = path.join(STAGING, 'meta.json')
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf8')

  console.log(`[perf] generated ${files.length} images in ${SCENES.length} scenes`)
  return { files, stagingDir: STAGING, meta }
}

// 从文件路径提取 tags
export function extractTagsFromPath(filepath, stagingDir) {
  const rel = path.relative(stagingDir, filepath)
  const parts = path.dirname(rel).split(path.sep)
  return parts.filter(Boolean)
}

// CLI 入口
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const count = parseInt(process.argv[2]) || 5
  generateFixtures(count).then(({ files }) => {
    console.log('[perf] done. samples:')
    files.slice(0, 3).forEach(f => console.log('  -', path.relative(STAGING, f.path)))
  })
}
