// scripts/gallery/derivatives.mjs
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

export async function generateDerivatives(srcPath, id, outRoot, specs) {
  await fs.mkdir(outRoot, { recursive: true })

  const buf = await fs.readFile(srcPath)
  const sourceMeta = await sharp(buf).metadata()
  const result = derivativeManifest(id, specs)

  for (const spec of specs) {
    for (const fmt of spec.formats) {
      const rel = `${id}-${spec.name}.${fmt}`
      const abs = path.join(outRoot, rel)
      // 内容寻址 + 规格校验: 已存在且长边匹配才跳过
      const expectedLongEdge = Math.min(spec.width, longestEdge(sourceMeta) ?? spec.width)
      if (await isFreshDerivative(abs, expectedLongEdge)) continue
      await sharp(buf)
        .resize({
          width: spec.width,
          height: spec.width,
          fit: 'inside',
          withoutEnlargement: true,
        })
        [fmt]({ quality: 82 })
        .toFile(abs)
    }
  }
  await pruneStaleDerivatives(outRoot, id, specs)
  return result
}

export function derivativeManifest(id, specs) {
  const result = {}
  for (const spec of specs) {
    result[spec.name] = { w: spec.width }
    for (const fmt of spec.formats) {
      result[spec.name][fmt] = `${id}-${spec.name}.${fmt}`
    }
  }
  return result
}

export async function generatePlaceholder(srcPath) {
  const image = sharp(srcPath)
  const { dominant } = await image.clone().stats()
  const placeholder = await image
    .clone()
    .resize({ width: 128, withoutEnlargement: true })
    .jpeg({ quality: 55, mozjpeg: true })
    .toBuffer()
  const placeholderMeta = await sharp(placeholder).metadata()

  return {
    placeholder: svgPlaceholder(
      `data:image/jpeg;base64,${placeholder.toString('base64')}`,
      placeholderMeta.width ?? 128,
      placeholderMeta.height ?? 86,
    ),
    bg: rgbToHex(dominant.r, dominant.g, dominant.b),
  }
}

function svgPlaceholder(imageHref, width, height) {
  const svg = [
    `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'>`,
    '<metadata>gallery-placeholder-v5</metadata>',
    "<filter id='b' color-interpolation-filters='sRGB' x='-20%' y='-20%' width='140%' height='140%'>",
    "<feGaussianBlur stdDeviation='4'/>",
    "<feColorMatrix values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 100 -1' result='s'/>",
    "<feFlood x='0' y='0' width='100%' height='100%'/>",
    "<feComposite operator='out' in='s'/>",
    "<feComposite in2='SourceGraphic'/>",
    "<feGaussianBlur stdDeviation='4'/>",
    '</filter>',
    `<image width='${width}' height='${height}' x='0' y='0' preserveAspectRatio='xMidYMid' style='filter:url(#b);' href='${imageHref}'/>`,
    '</svg>',
  ].join('')
  return `data:image/svg+xml;charset=utf-8,${encodeSvgData(svg)}`
}

function encodeSvgData(svg) {
  return encodeURIComponent(svg)
    .replace(/[!'()*]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b]
    .map(channel => Math.round(channel).toString(16).padStart(2, '0'))
    .join('')}`
}

async function exists(p) {
  try { await fs.access(p); return true } catch { return false }
}

function longestEdge(meta) {
  const width = meta.width ?? 0
  const height = meta.height ?? 0
  const edge = Math.max(width, height)
  return edge > 0 ? edge : null
}

async function isFreshDerivative(p, longEdge) {
  if (!await exists(p)) return false
  try {
    const meta = await sharp(p).metadata()
    return longestEdge(meta) === longEdge
  } catch {
    return false
  }
}

async function pruneStaleDerivatives(outRoot, id, specs) {
  const keep = new Set(specs.flatMap(spec => spec.formats.map(fmt => `${id}-${spec.name}.${fmt}`)))
  const entries = await fs.readdir(outRoot, { withFileTypes: true })
  await Promise.all(entries
    .filter(entry => entry.isFile() && entry.name.startsWith(`${id}-`) && !keep.has(entry.name))
    .map(entry => fs.rm(path.join(outRoot, entry.name), { force: true })))
}
