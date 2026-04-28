// scripts/gallery/generate-rich-fixtures.mjs
// 生成丰富的跨年份测试图片到 gallery-staging
// 包含：多场景、多年份、丰富 EXIF、GPS、标题、描述、标签、专辑配置

import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import sharp from 'sharp'
import piexif from 'piexifjs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const STAGING = path.join(ROOT, 'gallery-staging')

// ============== 场景定义 ==============
// 每个场景：目录路径、基础颜色、常见比例、相机配置、标题列表、描述列表、标签
const SCENES = [
  {
    category: '风景', sub: '日落',
    color: '#E85D04', ratios: ['3:2', '16:9', '2:3', '1:1'],
    gear: { make: 'Canon', model: 'EOS R5', lens: 'RF 24-70mm F2.8L IS USM', flMin: 24, flMax: 70, fnMin: 80, fnMax: 110, isoMin: 100, isoMax: 400, expMin: 1, expMax: 30 },
    titles: ['金色余晖', '暮光之城', '夕阳无限', '火烧云', '最后一缕光', '日落大道', '黄昏剪影'],
    descs: ['日落时分的温暖色调', '天空被染成橙红色', '海平面上的落日', '云层中的金色光芒', '暮色渐浓的时刻', '天边燃烧的云彩', '黄昏时分的静谧'],
    gpsBase: { lat: 35.0, lon: 139.0 },
  },
  {
    category: '风景', sub: '海边',
    color: '#0077B6', ratios: ['3:2', '16:9', '2:3'],
    gear: { make: 'Sony', model: 'A7R V', lens: 'FE 16-35mm F2.8 GM', flMin: 16, flMax: 35, fnMin: 80, fnMax: 130, isoMin: 100, isoMax: 400, expMin: 1, expMax: 60 },
    titles: ['海浪拍岸', '蓝色时刻', '潮汐之间', '海岸线', '浪花飞溅', '海天一线', '礁石与浪'],
    descs: ['海浪轻抚沙滩', '清晨的海边宁静', '潮水退去后的痕迹', '一望无际的蔚蓝', '浪花中的光影', '日出时分的海面', '潮起潮落的韵律'],
    gpsBase: { lat: 24.0, lon: 118.0 },
  },
  {
    category: '风景', sub: '山脉',
    color: '#6A994E', ratios: ['3:2', '16:9', '1:1', '2:3'],
    gear: { make: 'Nikon', model: 'Z8', lens: 'NIKKOR Z 14-24mm F2.8 S', flMin: 14, flMax: 24, fnMin: 80, fnMax: 160, isoMin: 100, isoMax: 800, expMin: 1, expMax: 125 },
    titles: ['云海之上', '山巅日出', '层峦叠嶂', '云雾缭绕', '群山剪影', '雪峰之巅', '山谷晨雾'],
    descs: ['高山之巅的壮阔', '云海翻涌的奇观', '日出时分的山峰', '层叠的山峦曲线', '云雾中的神秘感', '雪线之上的世界', '晨光中的山谷'],
    gpsBase: { lat: 30.0, lon: 103.0 },
  },
  {
    category: '风景', sub: '森林',
    color: '#2D6A4F', ratios: ['3:2', '2:3', '1:1'],
    gear: { make: 'Sony', model: 'A7C II', lens: 'FE 35mm F1.4 GM', flMin: 35, flMax: 35, fnMin: 14, fnMax: 56, isoMin: 200, isoMax: 1600, expMin: 30, expMax: 250 },
    titles: ['林间小径', '阳光穿透', '青苔石阶', '深秋落叶', '晨雾森林', '古树参天', '溪水潺潺'],
    descs: ['森林深处的宁静', '阳光穿透树冠的瞬间', '青苔覆盖的石阶', '秋天落叶铺成地毯', '晨雾弥漫的林间', '千年古树的沧桑', '溪水在林间流淌'],
    gpsBase: { lat: 45.5, lon: 124.0 },
  },
  {
    category: '风景', sub: '雪景',
    color: '#90E0EF', ratios: ['3:2', '16:9', '1:1'],
    gear: { make: 'Canon', model: 'EOS R6 Mark II', lens: 'RF 15-35mm F2.8L IS USM', flMin: 15, flMax: 35, fnMin: 80, fnMax: 160, isoMin: 100, isoMax: 800, expMin: 1, expMax: 250 },
    titles: ['银装素裹', '雪中木屋', '冰晶世界', '雪原辽阔', '雾凇奇观', '冰川裂缝', '极光之夜'],
    descs: ['大雪覆盖的宁静世界', '雪山中的温暖木屋', '冰晶折射的光芒', '一望无际的雪原', '树枝上的雾凇奇观', '冰川深处的裂缝', '极光映照的雪地'],
    gpsBase: { lat: 69.6, lon: 23.5 },
  },
  {
    category: '城市', sub: '街拍',
    color: '#9D4EDD', ratios: ['2:3', '3:2', '1:1'],
    gear: { make: 'Fujifilm', model: 'X-T5', lens: 'XF 35mm F1.4 R', flMin: 35, flMax: 35, fnMin: 14, fnMax: 56, isoMin: 200, isoMax: 1600, expMin: 60, expMax: 500 },
    titles: ['街头巷尾', '城市脉搏', '行人匆匆', '街角故事', '光影交错', '雨后街头', '市井烟火'],
    descs: ['街头的瞬间捕捉', '城市生活的切片', '光影中的行人', '街角的独特视角', '都市节奏的凝固', '雨后街道的倒影', '市井生活的烟火气'],
    gpsBase: { lat: 31.2, lon: 121.5 },
  },
  {
    category: '城市', sub: '夜景',
    color: '#3C096C', ratios: ['16:9', '3:2', '2:3'],
    gear: { make: 'Sony', model: 'A7S III', lens: 'FE 24mm F1.4 GM', flMin: 24, flMax: 24, fnMin: 14, fnMax: 28, isoMin: 800, isoMax: 6400, expMin: 8, expMax: 30 },
    titles: ['霓虹闪烁', '城市不眠', '夜色阑珊', '灯火通明', '午夜街头', '摩天夜景', '车流光轨'],
    descs: ['城市夜晚的灯光', '霓虹招牌的倒影', '车水马龙的光轨', '深夜的静谧街景', '灯火阑珊处', '高楼林立的夜景', '长曝光下的车流'],
    gpsBase: { lat: 22.3, lon: 114.2 },
  },
  {
    category: '城市', sub: '天际线',
    color: '#7209B7', ratios: ['16:9', '3:2', '21:9'],
    gear: { make: 'Sony', model: 'A7R V', lens: 'FE 70-200mm F2.8 GM OSS II', flMin: 70, flMax: 200, fnMin: 80, fnMax: 110, isoMin: 100, isoMax: 400, expMin: 1, expMax: 60 },
    titles: ['天际轮廓', '落日余晖', '高楼林立', '城市全景', '晨雾城市', '夜幕降临', '云端之上'],
    descs: ['城市天际线的轮廓', '落日映照的高楼', '摩天大楼的森林', '俯瞰城市全景', '晨雾中的城市', '夜幕降临时分', '高楼之上的云海'],
    gpsBase: { lat: 31.2, lon: 121.5 },
  },
  {
    category: '人像', sub: '室内',
    color: '#FF006E', ratios: ['2:3', '3:2', '1:1'],
    gear: { make: 'Canon', model: 'EOS R6 Mark II', lens: 'RF 85mm F1.2L USM', flMin: 85, flMax: 85, fnMin: 12, fnMax: 28, isoMin: 400, isoMax: 3200, expMin: 60, expMax: 250 },
    titles: ['窗边的光', '室内一隅', '柔和光影', '静谧时刻', '温暖色调', '阅读时光', '咖啡香气'],
    descs: ['自然光下的人像', '室内柔和的氛围', '窗边洒落的阳光', '安静的一隅空间', '温暖的室内色调', '午后阅读的时光', '咖啡馆里的人像'],
    gpsBase: { lat: 39.9, lon: 116.4 },
  },
  {
    category: '人像', sub: '黑白',
    color: '#6C757D', ratios: ['2:3', '1:1', '3:2'],
    gear: { make: 'Leica', model: 'M11 Monochrom', lens: 'Summilux-M 50mm F1.4 ASPH.', flMin: 50, flMax: 50, fnMin: 14, fnMax: 80, isoMin: 200, isoMax: 3200, expMin: 60, expMax: 500 },
    titles: ['黑白印象', '光影人像', '灰度世界', '轮廓之美', '明与暗', '街头人像', '岁月痕迹'],
    descs: ['褪去色彩的纯粹', '光影勾勒的轮廓', '黑白之间的层次', '灰度中的情感', '明暗对比的力量', '街头的黑白人像', '岁月留下的痕迹'],
    gpsBase: { lat: 48.9, lon: 2.3 },
  },
  {
    category: '人像', sub: '户外',
    color: '#F4A261', ratios: ['2:3', '3:2', '1:1'],
    gear: { make: 'Nikon', model: 'Z6 III', lens: 'NIKKOR Z 85mm F1.8 S', flMin: 85, flMax: 85, fnMin: 18, fnMax: 56, isoMin: 100, isoMax: 800, expMin: 60, expMax: 500 },
    titles: ['田野人像', '逆光剪影', '花丛中的微笑', '海边漫步', '公园长椅', '樱花树下', '夕阳背影'],
    descs: ['田野间的自然人像', '逆光中的优美剪影', '花丛中的灿烂笑容', '海边漫步的惬意', '公园长椅上的故事', '樱花树下的美好', '夕阳下的背影'],
    gpsBase: { lat: 35.0, lon: 135.5 },
  },
  {
    category: '建筑', sub: '现代',
    color: '#023E8A', ratios: ['2:3', '9:16', '3:2', '1:1'],
    gear: { make: 'Sony', model: 'A7R V', lens: 'FE 12-24mm F2.8 GM', flMin: 12, flMax: 24, fnMin: 80, fnMax: 130, isoMin: 100, isoMax: 400, expMin: 1, expMax: 60 },
    titles: ['几何之美', '线条构成', '玻璃幕墙', '摩天大楼', '现代极简', '螺旋楼梯', '光影交错'],
    descs: ['现代建筑的线条', '玻璃反射的天空', '几何构成的画面', '极简的建筑美学', '钢铁与玻璃的对话', '旋转楼梯的韵律', '建筑中的光影游戏'],
    gpsBase: { lat: 25.0, lon: 55.3 },
  },
  {
    category: '建筑', sub: '古典',
    color: '#B08968', ratios: ['2:3', '1:1', '3:2'],
    gear: { make: 'Hasselblad', model: 'X2D 100C', lens: 'XCD 45mm F4 P', flMin: 45, flMax: 45, fnMin: 56, fnMax: 110, isoMin: 100, isoMax: 400, expMin: 1, expMax: 125 },
    titles: ['时光痕迹', '古典韵味', '雕花细节', '历史建筑', '岁月沉淀', '教堂穹顶', '石拱桥'],
    descs: ['古典建筑的细节', '岁月留下的痕迹', '精美的雕花工艺', '历史建筑的庄重', '时光凝固的瞬间', '教堂穹顶的壮丽', '古桥上的风景'],
    gpsBase: { lat: 41.9, lon: 12.5 },
  },
  {
    category: '建筑', sub: '桥梁',
    color: '#457B9D', ratios: ['16:9', '3:2', '2:3'],
    gear: { make: 'Canon', model: 'EOS R5', lens: 'RF 70-200mm F2.8L IS USM', flMin: 70, flMax: 200, fnMin: 80, fnMax: 130, isoMin: 100, isoMax: 400, expMin: 1, expMax: 125 },
    titles: ['钢铁巨龙', '悬索之美', '桥上车流', '桥洞光影', '跨江大桥', '古桥风韵', '桥与倒影'],
    descs: ['钢铁桥梁的宏伟', '悬索桥的线条美', '桥上川流不息', '桥洞中的光影', '横跨江面的大桥', '古桥的历史韵味', '水面上的桥影'],
    gpsBase: { lat: 30.5, lon: 114.3 },
  },
  {
    category: '动物', sub: '野生',
    color: '#D62828', ratios: ['3:2', '1:1', '2:3'],
    gear: { make: 'Nikon', model: 'Z9', lens: 'NIKKOR Z 400mm F2.8 TC VR S', flMin: 400, flMax: 400, fnMin: 28, fnMax: 80, isoMin: 400, isoMax: 3200, expMin: 500, expMax: 2000 },
    titles: ['野外追踪', '眼神交汇', '自然精灵', '捕食瞬间', '栖息地', '草原之王', '飞鸟展翅'],
    descs: ['野生动物的凝视', '自然中的灵动瞬间', '捕食者的专注', '栖息地的一隅', '生态链上的角色', '草原上的王者', '展翅高飞的瞬间'],
    gpsBase: { lat: -1.3, lon: 36.8 },
  },
  {
    category: '动物', sub: '宠物',
    color: '#F77F00', ratios: ['1:1', '3:2', '2:3'],
    gear: { make: 'Fujifilm', model: 'X-T5', lens: 'XF 56mm F1.2 R', flMin: 56, flMax: 56, fnMin: 12, fnMax: 28, isoMin: 400, isoMax: 1600, expMin: 125, expMax: 500 },
    titles: ['慵懒午后', '萌态百出', '陪伴时光', '好奇眼神', '温馨时刻', '打盹时光', '嬉戏瞬间'],
    descs: ['宠物的慵懒姿态', '萌萌的表情瞬间', '与主人的温馨时刻', '好奇探索的眼神', '午后阳光下的惬意', '午后打盹的可爱', '嬉戏玩耍的瞬间'],
    gpsBase: { lat: 51.5, lon: -0.1 },
  },
  {
    category: '美食', sub: '料理',
    color: '#E63946', ratios: ['1:1', '4:3', '3:2'],
    gear: { make: 'Sony', model: 'A7C II', lens: 'FE 50mm F2.5 G', flMin: 50, flMax: 50, fnMin: 25, fnMax: 56, isoMin: 200, isoMax: 1600, expMin: 60, expMax: 250 },
    titles: ['精致摆盘', '热气腾腾', '色彩缤纷', '深夜食堂', '甜品时刻', '咖啡拉花', '新鲜出炉'],
    descs: ['精心摆盘的美食', '热气腾腾的料理', '色彩丰富的食材', '深夜食堂的温暖', '精致的甜品', '咖啡拉花的艺术', '刚出炉的香气'],
    gpsBase: { lat: 35.6, lon: 139.7 },
  },
  {
    category: '微距', sub: '花卉',
    color: '#F72585', ratios: ['1:1', '4:3', '3:2'],
    gear: { make: 'Canon', model: 'EOS R5', lens: 'RF 100mm F2.8L Macro IS USM', flMin: 100, flMax: 100, fnMin: 28, fnMax: 110, isoMin: 100, isoMax: 1600, expMin: 60, expMax: 500 },
    titles: ['花瓣纹理', '露珠晶莹', '花蕊特写', '花开瞬间', '双色花瓣', '野花烂漫', '郁金香田'],
    descs: ['花瓣上的细腻纹理', '露珠折射的光芒', '花蕊的微观世界', '花朵绽放的瞬间', '双色花瓣的奇观', '野花草地的烂漫', '郁金香田的壮观'],
    gpsBase: { lat: 52.0, lon: 4.5 },
  },
]

const RATIO_SIZES = {
  '3:2':  [1800, 1200],
  '2:3':  [1200, 1800],
  '16:9': [1920, 1080],
  '9:16': [1080, 1920],
  '1:1':  [1500, 1500],
  '4:3':  [1600, 1200],
  '21:9': [2520, 1080],
}

// ============== 年份配置 ==============
const YEARS = [2020, 2021, 2022, 2023, 2024, 2025]
const PHOTOS_PER_SCENE_PER_YEAR = 3  // 每年每个子场景生成3张

// ============== 辅助函数 ==============

function svgText(text, subtext, w, h, color) {
  const textColor = isLight(color) ? '#1a1a1a' : '#f0f0f0'
  return Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${color}" />
    <text x="50%" y="38%" dominant-baseline="middle" text-anchor="middle"
      font-family="system-ui, -apple-system, sans-serif" font-size="${Math.min(w, h) / 10}" fill="${textColor}" opacity="0.85" font-weight="600">
      ${escapeXml(text)}
    </text>
    <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle"
      font-family="system-ui, -apple-system, sans-serif" font-size="${Math.min(w, h) / 18}" fill="${textColor}" opacity="0.6">
      ${escapeXml(subtext)}
    </text>
    <text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle"
      font-family="system-ui, -apple-system, sans-serif" font-size="${Math.min(w, h) / 24}" fill="${textColor}" opacity="0.4">
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
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(1, 3), 16) + (index % 5 - 2) * 10))
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(3, 5), 16) + (index % 7 - 3) * 8))
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(5, 7), 16) + (index % 3 - 1) * 12))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function randomParam(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function formatExposureTime(denominator) {
  return `1/${denominator}`
}

function randomGPS(baseLat, baseLon, index) {
  const lat = baseLat + (Math.sin(index * 1.3) * 0.8)
  const lon = baseLon + (Math.cos(index * 0.7) * 0.8)
  return { lat, lon }
}

function degToDMS(deg) {
  const d = Math.floor(Math.abs(deg))
  const m = Math.floor((Math.abs(deg) - d) * 60)
  const s = Math.round(((Math.abs(deg) - d) * 60 - m) * 60 * 100) / 100
  return [[d, 1], [m, 1], [Math.round(s * 100), 100]]
}

function contentHash(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 12)
}

// 从文件路径提取标签
export function extractTagsFromPath(filepath, stagingDir) {
  const rel = path.relative(stagingDir, filepath)
  const parts = path.dirname(rel).split(path.sep)
  return parts.filter(Boolean)
}

// ============== 生成函数 ==============

async function generatePhoto(scene, year, index, globalIndex) {
  const dirPath = path.join(STAGING, scene.category, scene.sub)
  await fs.mkdir(dirPath, { recursive: true })

  const ratio = scene.ratios[index % scene.ratios.length]
  const [baseW, baseH] = RATIO_SIZES[ratio]
  const w = baseW + (index % 3 - 1) * 80
  const h = baseH + (index % 5 - 2) * 60
  const color = varyColor(scene.color, globalIndex)

  // 文件名: YYYY_序号_分类-子分类_比例.jpg
  const filename = `${year}_${String(index + 1).padStart(2, '0')}_${scene.category}-${scene.sub}_${ratio.replace(':', 'x')}.jpg`
  const filepath = path.join(dirPath, filename)

  // 拍摄日期：该年内随机
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
  const dayOfYear = Math.floor(Math.random() * (isLeap ? 366 : 365))
  const date = new Date(year, 0, 1)
  date.setDate(date.getDate() + dayOfYear)
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ':')
  const hour = 5 + Math.floor(Math.random() * 15) // 05:00 - 19:00 为主
  const minute = Math.floor(Math.random() * 60)
  const second = Math.floor(Math.random() * 60)
  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
  const dateTimeStr = `${dateStr} ${timeStr}`

  // GPS
  const gps = randomGPS(scene.gpsBase.lat, scene.gpsBase.lon, globalIndex)

  // 拍摄参数
  const fl = randomParam(scene.gear.flMin, scene.gear.flMax)
  const fnVal = randomParam(scene.gear.fnMin, scene.gear.fnMax)
  const iso = randomParam(scene.gear.isoMin, scene.gear.isoMax)
  const expDenom = randomParam(scene.gear.expMin, scene.gear.expMax)

  // EXIF
  const exifObj = {
    '0th': {
      [piexif.ImageIFD.Make]: scene.gear.make,
      [piexif.ImageIFD.Model]: scene.gear.model,
      [piexif.ImageIFD.DateTime]: dateTimeStr,
      [piexif.ImageIFD.ImageDescription]: `${scene.titles[index % scene.titles.length]} - ${scene.descs[index % scene.descs.length]}`,
    },
    'Exif': {
      [piexif.ExifIFD.FNumber]: [fnVal, 10],
      [piexif.ExifIFD.ExposureTime]: [1, expDenom],
      [piexif.ExifIFD.ISOSpeedRatings]: iso,
      [piexif.ExifIFD.FocalLength]: [fl * 10, 10],
      [piexif.ExifIFD.LensModel]: scene.gear.lens,
      [piexif.ExifIFD.DateTimeOriginal]: dateTimeStr,
      [piexif.ExifIFD.ExposureBiasValue]: [randomParam(-10, 10), 10],
      [piexif.ExifIFD.MeteringMode]: randomParam(1, 5),
      [piexif.ExifIFD.WhiteBalance]: Math.random() > 0.5 ? 0 : 1,
    },
    'GPS': {
      [piexif.GPSIFD.GPSLatitudeRef]: gps.lat >= 0 ? 'N' : 'S',
      [piexif.GPSIFD.GPSLatitude]: degToDMS(gps.lat),
      [piexif.GPSIFD.GPSLongitudeRef]: gps.lon >= 0 ? 'E' : 'W',
      [piexif.GPSIFD.GPSLongitude]: degToDMS(gps.lon),
      [piexif.GPSIFD.GPSAltitudeRef]: 0,
      [piexif.GPSIFD.GPSAltitude]: [Math.floor(Math.random() * 5000), 1],
    }
  }

  // 生成图片
  const title = scene.titles[index % scene.titles.length]
  const desc = scene.descs[index % scene.descs.length]
  const subtext = `${year} · ${scene.category} · ${scene.sub}`
  const svg = svgText(title, subtext, w, h, color)
  const jpegBuf = await sharp(svg).jpeg({ quality: 85, mozjpeg: true }).toBuffer()
  const exifBytes = piexif.dump(exifObj)
  const newJpeg = piexif.insert(exifBytes, jpegBuf.toString('binary'))
  await fs.writeFile(filepath, Buffer.from(newJpeg, 'binary'))

  // 计算 content hash
  const id = contentHash(Buffer.from(newJpeg, 'binary'))

  // 标签
  const tags = [scene.category, scene.sub]

  return {
    id,
    filepath,
    filename,
    title,
    desc,
    year,
    scene: `${scene.category}/${scene.sub}`,
    w, h,
    ratio,
    tags,
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
  }
}

// ============== 专辑配置生成 ==============

function generateAlbums(photos) {
  const albums = []

  // 1. 按年份的精选专辑
  for (const year of YEARS) {
    const yearPhotos = photos.filter(p => p.year === year)
    if (yearPhotos.length === 0) continue
    // 每个年份精选 6-10 张
    const selected = yearPhotos
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(10, Math.max(6, Math.floor(yearPhotos.length * 0.3))))
      .map(p => p.id)
    albums.push({
      id: `featured-${year}`,
      title: `${year} 年度精选`,
      desc: `${year} 年拍摄的精选作品合集，涵盖多个场景`,
      cover: selected[0],
      createdAt: `${year}-12`,
      photos: selected,
    })
  }

  // 2. 按场景分类的专辑
  const categoryMap = new Map()
  for (const p of photos) {
    const cat = p.tags[0] // 第一个标签是分类
    if (!categoryMap.has(cat)) categoryMap.set(cat, [])
    categoryMap.get(cat).push(p)
  }

  const categoryTitles = {
    '风景': { title: '自然风光', desc: '山川湖海，日出日落，大自然的壮丽景色' },
    '城市': { title: '城市印象', desc: '街拍、夜景、天际线，城市的多面魅力' },
    '人像': { title: '人物瞬间', desc: '室内、黑白、户外，记录人物的光影故事' },
    '建筑': { title: '建筑之美', desc: '现代、古典、桥梁，建筑的艺术表达' },
    '动物': { title: '生灵百态', desc: '野生动物与宠物，捕捉生命的灵动瞬间' },
    '美食': { title: '味蕾记忆', desc: '精致料理与街头美食，记录舌尖上的美好' },
    '微距': { title: '微观世界', desc: '花卉微距，发现肉眼难以察觉的奇妙细节' },
  }

  for (const [cat, catPhotos] of categoryMap) {
    const info = categoryTitles[cat] || { title: cat, desc: `${cat}摄影作品集` }
    const selected = catPhotos
      .sort((a, b) => b.year - a.year)
      .slice(0, Math.min(20, catPhotos.length))
      .map(p => p.id)
    albums.push({
      id: `cat-${cat}`,
      title: info.title,
      desc: info.desc,
      cover: selected[0],
      createdAt: '2024-12',
      photos: selected,
    })
  }

  // 3. 按子场景的精选专辑（选一些热门子场景）
  const subSceneMap = new Map()
  for (const p of photos) {
    const key = p.scene
    if (!subSceneMap.has(key)) subSceneMap.set(key, [])
    subSceneMap.get(key).push(p)
  }

  const subSceneAlbums = [
    { match: '风景/日落', id: 'sunset', title: '日落集', desc: '追逐每一抹夕阳' },
    { match: '风景/海边', id: 'seaside', title: '海之韵', desc: '海浪、沙滩与天际线' },
    { match: '城市/夜景', id: 'night-city', title: '霓虹都市', desc: '城市夜晚的璀璨光芒' },
    { match: '人像/黑白', id: 'mono-portrait', title: '黑白人像', desc: '褪去色彩的情感表达' },
    { match: '动物/野生', id: 'wildlife', title: '野性呼唤', desc: '自然中的野生动物' },
  ]

  for (const sa of subSceneAlbums) {
    const subPhotos = subSceneMap.get(sa.match) || []
    if (subPhotos.length === 0) continue
    const selected = subPhotos
      .sort((a, b) => b.year - a.year)
      .slice(0, Math.min(12, subPhotos.length))
      .map(p => p.id)
    albums.push({
      id: sa.id,
      title: sa.title,
      desc: sa.desc,
      cover: selected[0],
      createdAt: '2024-12',
      photos: selected,
    })
  }

  // 4. 特殊主题专辑
  // 长曝光（海边 + 夜景 + 车流）
  const longExpPhotos = photos.filter(p =>
    p.scene === '风景/海边' || p.scene === '城市/夜景' || p.scene === '建筑/桥梁'
  ).sort(() => Math.random() - 0.5).slice(0, 10).map(p => p.id)
  if (longExpPhotos.length > 0) {
    albums.push({
      id: 'long-exposure',
      title: '长曝光',
      desc: '用慢门捕捉时间的流动',
      cover: longExpPhotos[0],
      createdAt: '2024-12',
      photos: longExpPhotos,
    })
  }

  // 广角世界（风景 + 建筑）
  const wideAnglePhotos = photos.filter(p =>
    p.tags[0] === '风景' || p.tags[0] === '建筑'
  ).sort(() => Math.random() - 0.5).slice(0, 12).map(p => p.id)
  if (wideAnglePhotos.length > 0) {
    albums.push({
      id: 'wide-angle',
      title: '广角视界',
      desc: '用广角镜头记录壮阔场景',
      cover: wideAnglePhotos[0],
      createdAt: '2024-12',
      photos: wideAnglePhotos,
    })
  }

  // 5. 空专辑（用于测试）
  albums.push({
    id: 'empty-test',
    title: '空专辑',
    desc: '用于测试空状态展示',
    cover: null,
    createdAt: '2024-12',
    photos: [],
  })

  return albums
}

// ============== 主流程 ==============

async function main() {
  console.log('[rich-fixtures] 开始生成丰富测试数据...')
  console.log(`[rich-fixtures] 年份: ${YEARS.join(', ')}`)
  console.log(`[rich-fixtures] 场景数: ${SCENES.length}`)
  console.log(`[rich-fixtures] 每年每个场景: ${PHOTOS_PER_SCENE_PER_YEAR} 张`)
  console.log(`[rich-fixtures] 预计总张数: ${SCENES.length * YEARS.length * PHOTOS_PER_SCENE_PER_YEAR}`)

  // 清理 staging 目录（保留 .gitkeep）
  console.log('[rich-fixtures] 清理 gallery-staging...')
  const entries = await fs.readdir(STAGING, { withFileTypes: true })
  for (const e of entries) {
    if (e.name === '.gitkeep') continue
    await fs.rm(path.join(STAGING, e.name), { recursive: true })
  }

  const allPhotos = []
  let globalIndex = 0

  // 生成所有照片
  for (const year of YEARS) {
    for (const scene of SCENES) {
      for (let i = 0; i < PHOTOS_PER_SCENE_PER_YEAR; i++) {
        const photo = await generatePhoto(scene, year, i, globalIndex)
        allPhotos.push(photo)
        globalIndex++
      }
    }
    console.log(`[rich-fixtures] ${year}年 完成 (${globalIndex} 张)`)
  }

  // 生成 meta.json
  const meta = allPhotos.map(p => ({
    path: p.filepath,
    title: p.title,
    desc: p.desc,
    year: p.year,
    exif: p.exif,
  }))
  await fs.writeFile(path.join(STAGING, 'meta.json'), JSON.stringify(meta, null, 2), 'utf8')
  console.log(`[rich-fixtures] meta.json 已写入`)

  // 生成 albums.config.mjs
  const albums = generateAlbums(allPhotos)
  const albumsConfigContent = `// scripts/gallery/albums.config.mjs
// 用户手写 - 专辑归属的 single source of truth
// 形式: { id, title, desc, cover, createdAt, photos: [photoId, ...] }
// 注意: photos 数组中的 id 是 content hash，必须与 photos.json 中的 id 对应
// 此文件由 generate-rich-fixtures.mjs 自动生成，可手动修改

export default ${JSON.stringify(albums, null, 2)}
`
  await fs.writeFile(path.join(ROOT, 'scripts/gallery/albums.config.mjs'), albumsConfigContent, 'utf8')
  console.log(`[rich-fixtures] albums.config.mjs 已写入 (${albums.length} 个专辑)`)

  // 统计
  const stats = {
    total: allPhotos.length,
    byYear: {},
    byScene: {},
    byTag: {},
  }
  for (const p of allPhotos) {
    stats.byYear[p.year] = (stats.byYear[p.year] || 0) + 1
    stats.byScene[p.scene] = (stats.byScene[p.scene] || 0) + 1
    for (const t of p.tags) {
      stats.byTag[t] = (stats.byTag[t] || 0) + 1
    }
  }

  console.log('\n[rich-fixtures] ====== 生成统计 ======')
  console.log(`总计: ${stats.total} 张图片`)
  console.log('\n按年份:')
  for (const [y, c] of Object.entries(stats.byYear).sort()) {
    console.log(`  ${y}: ${c} 张`)
  }
  console.log('\n按场景:')
  for (const [s, c] of Object.entries(stats.byScene).sort()) {
    console.log(`  ${s}: ${c} 张`)
  }
  console.log('\n按标签:')
  for (const [t, c] of Object.entries(stats.byTag).sort()) {
    console.log(`  ${t}: ${c} 张`)
  }
  console.log(`\n专辑: ${albums.length} 个`)
  for (const a of albums) {
    console.log(`  ${a.id}: "${a.title}" (${a.photos.length} 张)`)
  }
  console.log('[rich-fixtures] ====== 完成 ======')
  console.log('\n下一步: npm run gallery:build')
}

main().catch(e => {
  console.error('[rich-fixtures] 失败:', e)
  process.exit(1)
})
