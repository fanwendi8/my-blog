import { S3Client, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { R2 } from './config.mjs'

export function makeR2Client() {
  if (!R2.endpoint) throw new Error('R2 not configured: set R2_ENDPOINT/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY')
  return new S3Client({
    region: 'auto',
    endpoint: R2.endpoint,
    credentials: { accessKeyId: R2.accessKeyId, secretAccessKey: R2.secretAccessKey },
  })
}

export async function uploadDerivatives(client, bucket, baseDir, items) {
  for (const item of items) {
    if (await exists(client, bucket, item.key)) continue
    await retry(() => client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: item.key,
      Body: item.body,
      ContentType: contentType(item.key),
      CacheControl: 'public, max-age=31536000, immutable',
    })))
  }
}

async function exists(client, bucket, key) {
  try { await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key })); return true }
  catch (e) {
    if (e.name === 'NotFound' || e.$metadata?.httpStatusCode === 404) return false
    throw e
  }
}

async function retry(fn, n = 3) {
  let last
  for (let i = 0; i < n; i++) {
    try { return await fn() }
    catch (e) { last = e; if (i < n - 1) await new Promise(r => setTimeout(r, 200 * 2 ** i)) }
  }
  throw last
}

function contentType(key) {
  if (key.endsWith('.webp')) return 'image/webp'
  if (key.endsWith('.avif')) return 'image/avif'
  if (key.endsWith('.jpg') || key.endsWith('.jpeg')) return 'image/jpeg'
  return 'application/octet-stream'
}
