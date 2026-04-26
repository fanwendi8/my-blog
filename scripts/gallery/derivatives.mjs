// scripts/gallery/derivatives.mjs
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { DERIVATIVES } from './config.mjs'

export async function generateDerivatives(srcPath, id, outRoot) {
  const dir = path.join(outRoot, id)
  await fs.mkdir(dir, { recursive: true })

  const buf = await fs.readFile(srcPath)
  const result = {}

  for (const spec of DERIVATIVES) {
    for (const fmt of spec.formats) {
      const rel = `${id}/${spec.name}.${fmt}`
      const abs = path.join(outRoot, rel)
      // 内容寻址 → 已存在则跳过
      if (await exists(abs)) {
        if (fmt === 'webp') result[spec.name] = rel
        continue
      }
      await sharp(buf)
        .resize({ width: spec.width, withoutEnlargement: true })
        [fmt]({ quality: 82 })
        .toFile(abs)
      if (fmt === 'webp') result[spec.name] = rel
    }
  }
  return result
}

async function exists(p) {
  try { await fs.access(p); return true } catch { return false }
}
