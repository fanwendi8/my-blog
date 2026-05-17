// scripts/gallery/scan.mjs
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { HASH_LEN } from './config.mjs'

const IMG_RE = /\.(jpe?g|png)$/i

export async function scanDirectory(dir) {
  const out = []
  await walk(dir, out)
  out.sort()
  return out
}

async function walk(dir, acc) {
  let entries
  try { entries = await fs.readdir(dir, { withFileTypes: true }) }
  catch { return }
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) await walk(full, acc)
    else if (IMG_RE.test(e.name)) acc.push(full)
  }
}

export async function contentHash(file) {
  const buf = await fs.readFile(file)
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0, HASH_LEN)
}
