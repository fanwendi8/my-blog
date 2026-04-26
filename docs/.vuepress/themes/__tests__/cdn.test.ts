// docs/.vuepress/themes/__tests__/cdn.test.ts
import { describe, it, expect } from 'vitest'
import { cdnUrl } from '../components/gallery/cdn'

describe('cdnUrl', () => {
  it('joins base and key with a single slash', () => {
    expect(cdnUrl('https://img.example.com', 'abc/thumb.webp'))
      .toBe('https://img.example.com/abc/thumb.webp')
  })
  it('strips trailing slash on base', () => {
    expect(cdnUrl('https://img.example.com/', 'abc/thumb.webp'))
      .toBe('https://img.example.com/abc/thumb.webp')
  })
  it('returns local path when base is empty', () => {
    expect(cdnUrl('', 'abc/thumb.webp')).toBe('/gallery-img/abc/thumb.webp')
  })
})
