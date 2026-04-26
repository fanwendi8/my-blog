// scripts/gallery/config.mjs
// 单一来源的常量 - R2 / 路径 / 衍生图规格
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '../..')

export const PATHS = {
  staging: path.join(ROOT, 'gallery-staging'),       // 用户放原图的目录
  derivatives: path.join(ROOT, '.gallery-cache'),    // 本地衍生图缓存
  manifestDir: path.join(ROOT, 'docs/.vuepress/public/gallery/data'),
  albumsConfig: path.join(__dirname, 'albums.config.mjs'),
}

// R2 / S3 兼容上传配置 - 从环境变量读取
export const R2 = {
  endpoint: process.env.R2_ENDPOINT ?? '',
  accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  bucket: process.env.R2_BUCKET ?? '',
  publicBase: process.env.R2_PUBLIC_BASE ?? '',      // 例: https://img.fanwendi.fun
}

// 衍生图规格 - 宽度 + 编码格式
export const DERIVATIVES = [
  { name: 'thumb',   width:  320, formats: ['webp'] },
  { name: 'preview', width: 1280, formats: ['webp', 'avif'] },
  { name: 'large',   width: 2560, formats: ['webp', 'avif'] },
]

export const BLURHASH = { x: 4, y: 3 }              // 4×3 components, 30 字节
export const HASH_LEN = 12                          // photo id 长度(sha256 前缀)
