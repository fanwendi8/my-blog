import { describe, expect, it } from 'vitest'
import path from 'node:path'
import { fileMetaKey } from '../build.mjs'

describe('fileMetaKey', () => {
  it('normalizes staging paths for portable meta.json lookups', () => {
    const staging = path.resolve('/project/gallery-staging')
    const absolute = path.join(staging, 'stories', '2.jpg')

    expect(fileMetaKey(absolute, staging)).toBe('stories/2.jpg')
    expect(fileMetaKey('stories/2.jpg', staging)).toBe('stories/2.jpg')
    expect(fileMetaKey('stories\\2.jpg', staging)).toBe('stories/2.jpg')
  })
})
