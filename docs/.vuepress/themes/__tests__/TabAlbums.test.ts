// docs/.vuepress/themes/__tests__/TabAlbums.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TabAlbums from '../components/gallery/TabAlbums.vue'
import type { Album, Photo } from '../components/gallery/types'

const albums: Album[] = [
  { id: 'x', title: '街拍', desc: '', cover: 'a', count: 2, createdAt: '2024-12' },
  { id: 'y', title: '风景', desc: '', cover: 'b', count: 1, createdAt: '2024-11' },
]
const photos: Photo[] = [
  { id: 'a', src: { thumb: 'a/thumb.webp', large: 'a/large.webp' }, w: 600, h: 400, blurhash: 'L', albums: ['x'], tags: [], takenAt: '2025-01-01T00:00:00Z' },
]

describe('TabAlbums', () => {
  it('renders one card per album', () => {
    const w = mount(TabAlbums, { props: { albums, photos } })
    expect(w.findAll('.gallery-album-card').length).toBe(2)
    expect(w.text()).toContain('街拍')
    expect(w.text()).toContain('2 张')
  })

  it('emits open with album id on click', async () => {
    const w = mount(TabAlbums, { props: { albums, photos } })
    await w.findAll('.gallery-album-card')[0].trigger('click')
    expect(w.emitted('open')?.[0]).toEqual(['x'])
  })
})
