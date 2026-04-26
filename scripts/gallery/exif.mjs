import fs from 'node:fs/promises'
import exifr from 'exifr'
import sharp from 'sharp'

export async function extractExif(file) {
  const buf = await fs.readFile(file)
  const stat = await fs.stat(file)
  const { width: w, height: h } = await sharp(buf).metadata()

  let raw = null
  try { raw = await exifr.parse(buf, { gps: true }) } catch {}

  const takenAt = (raw?.DateTimeOriginal ?? raw?.CreateDate ?? stat.mtime).toISOString()

  const exif = raw && (raw.Make || raw.LensModel || raw.FocalLength)
    ? {
        camera: [raw.Make, raw.Model].filter(Boolean).join(' ').trim() || null,
        lens: raw.LensModel ?? null,
        fl: raw.FocalLength ?? null,
        fn: raw.FNumber ?? null,
        iso: raw.ISO ?? null,
        exp: formatExposure(raw.ExposureTime),
      }
    : null

  const gps = raw && raw.latitude != null && raw.longitude != null
    ? { lat: raw.latitude, lon: raw.longitude }
    : null

  return { w, h, takenAt, exif, gps }
}

function formatExposure(t) {
  if (t == null) return null
  if (t >= 1) return `${t}s`
  return `1/${Math.round(1 / t)}`
}
