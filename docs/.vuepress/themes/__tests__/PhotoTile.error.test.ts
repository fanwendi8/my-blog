// docs/.vuepress/themes/__tests__/PhotoTile.error.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PhotoTile from '../components/gallery/PhotoTile.vue'

const photo = {
  id: 'a', src: { thumb: 'a/thumb.webp', large: 'a/large.webp' },
  w: 600, h: 400, blurhash: 'L', albums: [], tags: [], takenAt: '2025-04-01T00:00:00Z',
}

describe('PhotoTile error fallback', () => {
  it('renders error placeholder when img errors', async () => {
    const w = mount(PhotoTile, { props: { photo, width: 220, height: 146 } })
    await w.find('img').trigger('error')
    expect(w.find('.photo-tile__error').exists()).toBe(true)
  })
})
