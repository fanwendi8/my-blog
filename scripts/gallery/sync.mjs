// Sync generated gallery derivatives to R2.
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PATHS, R2 } from './config.mjs'
import { readPhotosOrEmpty } from './manifest.mjs'
import {
  deleteObjects,
  getJsonObject,
  makeR2Client,
  objectExists,
  putJsonObject,
  uploadDerivatives,
} from './uploader.mjs'

export const R2_MANIFEST_KEY = '.r2-manifest.json'

const argv = new Set(process.argv.slice(2))
const DRY = argv.has('--dry-run')
const PRUNE = argv.has('--prune')

export function extractObjectKeys(photos) {
  const keys = new Set()
  for (const photo of photos) {
    if (!photo?.src || typeof photo.src === 'string') continue
    for (const variant of Object.values(photo.src)) {
      if (!variant || typeof variant === 'string') continue
      for (const [name, relPath] of Object.entries(variant)) {
        if (name === 'w' || typeof relPath !== 'string') continue
        keys.add(relPath)
      }
    }
  }
  return [...keys].sort()
}

export function planPrune(previousObjects, currentObjects) {
  const current = new Set(currentObjects)
  return [...new Set(previousObjects)]
    .filter(key => !current.has(key))
    .sort()
}

export function prefixedObjectKey(prefix, key) {
  const normalizedPrefix = prefix.replace(/^\/+|\/+$/g, '')
  const normalizedKey = key.replace(/^\/+/, '')
  return normalizedPrefix ? `${normalizedPrefix}/${normalizedKey}` : normalizedKey
}

export function remoteManifestKey(prefix) {
  return prefixedObjectKey(prefix, R2_MANIFEST_KEY)
}

export async function findMissingObjects(client, bucket, keys) {
  const missing = []
  for (const key of keys) {
    if (!await objectExists(client, bucket, key)) missing.push(key)
  }
  return missing
}

async function objectItems(keys, prefix = '') {
  const items = []
  for (const key of keys) {
    items.push({
      key: prefixedObjectKey(prefix, key),
      body: await fs.readFile(path.join(PATHS.publicImages, key)),
    })
  }
  return items
}

async function main() {
  if (!R2.bucket) throw new Error('R2 not configured: set R2_BUCKET')

  const photos = await readPhotosOrEmpty(PATHS.manifestDir)
  const currentLocalObjects = extractObjectKeys(photos)
  const currentObjects = currentLocalObjects.map(key => prefixedObjectKey(R2.keyPrefix, key))
  const manifestKey = remoteManifestKey(R2.keyPrefix)
  const client = makeR2Client()
  const previousManifest = await getJsonObject(client, R2.bucket, manifestKey)
  const previousObjects = Array.isArray(previousManifest?.objects) ? previousManifest.objects : []
  const missingObjects = await findMissingObjects(client, R2.bucket, currentObjects)
  const staleObjects = planPrune(previousObjects, currentObjects)

  console.log(`[gallery] manifest objects: ${currentObjects.length}`)
  console.log(`[gallery] missing remote objects: ${missingObjects.length}`)
  console.log(`[gallery] previously managed remote objects: ${previousObjects.length}`)
  console.log(`[gallery] stale remote objects: ${staleObjects.length}`)

  if (DRY) {
    if (missingObjects.length) console.log(missingObjects.map(key => `  upload ${key}`).join('\n'))
    if (staleObjects.length) console.log(staleObjects.map(key => `  stale ${key}`).join('\n'))
    console.log('[gallery] dry-run: skip uploads/deletes/remote manifest update')
    return
  }

  const missingLocalObjects = currentLocalObjects
    .filter(key => missingObjects.includes(prefixedObjectKey(R2.keyPrefix, key)))
  const items = await objectItems(missingLocalObjects, R2.keyPrefix)
  console.log(`[gallery] uploading missing objects to R2 ...`)
  await uploadDerivatives(client, R2.bucket, PATHS.publicImages, items)

  if (PRUNE && staleObjects.length > 0) {
    console.log(`[gallery] pruning ${staleObjects.length} stale objects from R2 ...`)
    await deleteObjects(client, R2.bucket, staleObjects)
  } else if (staleObjects.length > 0) {
    console.log('[gallery] stale objects retained; rerun with --prune to delete them')
  }

  const managedObjects = PRUNE
    ? currentObjects
    : [...new Set([...previousObjects, ...currentObjects])].sort()

  await putJsonObject(client, R2.bucket, manifestKey, {
    version: 1,
    updatedAt: new Date().toISOString(),
    objects: managedObjects,
  })

  console.log(`[gallery] remote sync manifest written -> ${manifestKey}`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((e) => {
    console.error('[gallery] sync failed:', e.message)
    process.exit(1)
  })
}
