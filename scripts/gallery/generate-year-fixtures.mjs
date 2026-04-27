// 生成其他年份的测试图片到 gallery-staging
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import piexif from 'piexifjs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const STAGING = path.join(ROOT, 'gallery-staging')

const SCENES = [
  { color: '#E85D04', titles: [' golden hour', '暮光之城', '夕阳余晖'], descs: ['日落时分的温暖色调', '天空被染成橙红色', '海平面上的落日'] },
  { color: '#0077B6', titles: ['海浪拍岸', '蓝色时刻', '潮汐之间'], descs: ['海浪轻抚沙滩', '清晨的海边宁静', '潮水退去后的痕迹'] },
  { color: '#6A994E', titles: ['云海之上', '山巅日出', '层峦叠嶂'], descs: ['高山之巅的壮阔', '云海翻涌的奇观', '日出时分的山峰'] },
  { color: '#9D4EDD', titles: ['街头巷尾', '城市脉搏', '行人匆匆'], descs: ['街头的瞬间捕捉', '城市生活的切片', '光影中的行人'] },
  { color: '#3C096C', titles: ['霓虹闪烁', '城市不眠', '夜色阑珊'], descs: ['城市夜晚的灯光', '霓虹招牌的倒影', '车水马龙的光轨'] },
  { color: '#FF006E', titles: ['窗边的光', '室内一隅', '柔和光影'], descs: ['自然光下的人像', '室内柔和的氛围', '窗边洒落的阳光'] },
  { color: '#6C757D', titles: ['黑白印象', '光影人像', '灰度世界'], descs: ['褪去色彩的纯粹', '光影勾勒的轮廓', '黑白之间的层次'] },
  { color: '#023E8A', titles: ['几何之美', '线条构成', '玻璃幕墙'], descs: ['现代建筑的线条', '玻璃反射的天空', '几何构成的画面'] },
  { color: '#B08968', titles: ['时光痕迹', '古典韵味', '雕花细节'], descs: ['古典建筑的细节', '岁月留下的痕迹', '精美的雕花工艺'] },
  { color: '#D62828', titles: ['野外追踪', '眼神交汇', '自然精灵'], descs: ['野生动物的凝视', '自然中的灵动瞬间', '捕食者的专注'] },
  { color: '#F77F00', titles: ['慵懒午后', '萌态百出', '陪伴时光'], descs: ['宠物的慵懒姿态', '萌萌的表情瞬间', '与主人的温馨时刻'] },
]

function svgText(text, subtext, w, h, color) {
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  const textColor = (r * 0.299 + g * 0.587 + b * 0.114) > 128 ? '#000' : '#fff'
  return Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${color}" />
    <text x="50%" y="40%" dominant-baseline="middle" text-anchor="middle"
      font-family="sans-serif" font-size="${Math.min(w, h) / 8}" fill="${textColor}" opacity="0.8">
      ${text}
    </text>
    <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
      font-family="sans-serif" font-size="${Math.min(w, h) / 16}" fill="${textColor}" opacity="0.6">
      ${subtext}
    </text>
    <text x="50%" y="70%" dominant-baseline="middle" text-anchor="middle"
      font-family="sans-serif" font-size="${Math.min(w, h) / 20}" fill="${textColor}" opacity="0.4">
      ${w} x ${h}
    </text>
  </svg>`)
}

function varyColor(hex, index) {
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(1, 3), 16) + (index % 5 - 2) * 12))
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(3, 5), 16) + (index % 7 - 3) * 8))
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(5, 7), 16) + (index % 3 - 1) * 14))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function randomParam(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function degToDMS(deg) {
  const d = Math.floor(Math.abs(deg))
  const m = Math.floor((Math.abs(deg) - d) * 60)
  const s = Math.round(((Math.abs(deg) - d) * 60 - m) * 60 * 100) / 100
  return [[d, 1], [m, 1], [Math.round(s * 100), 100]]
}

async function generateForYear(year, count) {
  console.log(`[generate] ${year} year: ${count} images`)
  const files = []

  for (let i = 0; i < count; i++) {
    const scene = SCENES[i % SCENES.length]
    const ratio = i % 3 === 0 ? [1200, 1800] : i % 3 === 1 ? [1800, 1200] : [1600, 1500]
    const w = ratio[0] + (i % 5 - 2) * 100
    const h = ratio[1] + (i % 7 - 3) * 80
    const color = varyColor(scene.color, i)
    const filename = `test-${year}-${String(i + 1).padStart(2, '0')}.jpg`
    const filepath = path.join(STAGING, filename)

    // 随机日期在该年内
    const dayOfYear = Math.floor(Math.random() * (year % 4 === 0 ? 366 : 365))
    const date = new Date(year, 0, 1)
    date.setDate(date.getDate() + dayOfYear)
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ':')
    const timeStr = `${String(6 + Math.floor(Math.random() * 14)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
    const dateTimeStr = `${dateStr} ${timeStr}`

    // 随机 GPS
    const lat = 30 + Math.sin(i * 1.3) * 20
    const lon = 110 + Math.cos(i * 0.7) * 30

    // EXIF
    const exifObj = {
      '0th': {
        [piexif.ImageIFD.Make]: 'TestCamera',
        [piexif.ImageIFD.Model]: 'Model-X',
        [piexif.ImageIFD.DateTime]: dateTimeStr,
      },
      'Exif': {
        [piexif.ExifIFD.FNumber]: [randomParam(14, 80), 10],
        [piexif.ExifIFD.ExposureTime]: [1, randomParam(60, 500)],
        [piexif.ExifIFD.ISOSpeedRatings]: randomParam(100, 3200),
        [piexif.ExifIFD.FocalLength]: [randomParam(240, 800), 10],
        [piexif.ExifIFD.LensModel]: 'Test Lens 35mm',
        [piexif.ExifIFD.DateTimeOriginal]: dateTimeStr,
      },
      'GPS': {
        [piexif.GPSIFD.GPSLatitudeRef]: lat >= 0 ? 'N' : 'S',
        [piexif.GPSIFD.GPSLatitude]: degToDMS(lat),
        [piexif.GPSIFD.GPSLongitudeRef]: lon >= 0 ? 'E' : 'W',
        [piexif.GPSIFD.GPSLongitude]: degToDMS(lon),
      }
    }

    // 生成图片
    const title = scene.titles[i % scene.titles.length]
    const desc = scene.descs[i % scene.descs.length]
    const svg = svgText(title, `${year} · ${desc}`, w, h, color)
    const jpegBuf = await sharp(svg).jpeg({ quality: 85, mozjpeg: true }).toBuffer()
    const exifBytes = piexif.dump(exifObj)
    const newJpeg = piexif.insert(exifBytes, jpegBuf.toString('binary'))
    await fs.writeFile(filepath, Buffer.from(newJpeg, 'binary'))

    files.push({ path: filepath, filename, year, w, h })
  }

  return files
}

async function main() {
  await fs.mkdir(STAGING, { recursive: true })

  // 生成 2023 和 2022 年的图片
  const files2023 = await generateForYear(2023, 12)
  const files2022 = await generateForYear(2022, 8)

  console.log(`[generate] done: ${files2023.length + files2022.length} images -> ${STAGING}`)
}

main().catch(e => {
  console.error('[generate] failed:', e)
  process.exit(1)
})
