// scripts/gallery/blurhash.mjs
import sharp from 'sharp'
import { encode } from 'blurhash'
import { BLURHASH } from './config.mjs'

export async function encodeBlurhash(file) {
  const { data, info } = await sharp(file)
    .raw().ensureAlpha()
    .resize(32, 32, { fit: 'inside' })
    .toBuffer({ resolveWithObject: true })
  return encode(new Uint8ClampedArray(data), info.width, info.height, BLURHASH.x, BLURHASH.y)
}
