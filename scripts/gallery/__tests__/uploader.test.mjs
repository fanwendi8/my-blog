import { describe, it, expect, vi } from 'vitest'
import { uploadDerivatives } from '../uploader.mjs'

function makeFakeS3(existing = new Set()) {
  const sent = []
  return {
    sent,
    send: vi.fn(async (cmd) => {
      const name = cmd.constructor.name
      if (name === 'HeadObjectCommand') {
        if (existing.has(cmd.input.Key)) return {}
        const err = new Error('not found'); err.name = 'NotFound'; throw err
      }
      if (name === 'PutObjectCommand') { sent.push(cmd.input.Key); return {} }
      throw new Error('unknown command: ' + name)
    }),
  }
}

describe('uploadDerivatives', () => {
  it('skips keys that already exist remotely', async () => {
    const fake = makeFakeS3(new Set(['abc/thumb.webp']))
    await uploadDerivatives(fake, 'bucket', '/tmp', [
      { key: 'abc/thumb.webp', body: Buffer.from('x') },
      { key: 'abc/large.webp', body: Buffer.from('y') },
    ])
    expect(fake.sent).toEqual(['abc/large.webp'])
  })

  it('retries 3 times on transient failure', async () => {
    let attempts = 0
    const fake = {
      send: vi.fn(async (cmd) => {
        if (cmd.constructor.name === 'HeadObjectCommand') {
          const e = new Error('not found'); e.name = 'NotFound'; throw e
        }
        attempts++
        if (attempts < 3) throw new Error('transient')
        return {}
      }),
    }
    await uploadDerivatives(fake, 'bucket', '/tmp', [{ key: 'a', body: Buffer.from('x') }])
    expect(attempts).toBe(3)
  })
})
