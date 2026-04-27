// docs/.vuepress/themes/__tests__/PhotoTile.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PhotoTile from '../components/gallery/PhotoTile.vue'

const photo = {
  id: 'a', src: { thumb: 'a/thumb.webp', large: 'a/large.webp' },
  w: 600, h: 400, blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4', albums: [], tags: [], takenAt: '2025-04-01T00:00:00Z',
}

describe('PhotoTile', () => {
  it('renders an img with width/height attributes', () => {
    const w = mount(PhotoTile, { props: { photo, width: 220, height: 146 } })
    const img = w.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('width')).toBe('220')
    expect(img.attributes('height')).toBe('146')
  })

  it('uses lazy loading by default and eager when prop set', () => {
    const lazy = mount(PhotoTile, { props: { photo, width: 220, height: 146 } })
    expect(lazy.find('img').attributes('loading')).toBe('lazy')
    const eager = mount(PhotoTile, { props: { photo, width: 220, height: 146, eager: true } })
    expect(eager.find('img').attributes('loading')).toBe('eager')
  })

  it('renders a compact taken date in the metadata overlay', () => {
    const w = mount(PhotoTile, { props: { photo, width: 220, height: 146 } })
    expect(w.find('.photo-tile__date').text()).toBe('04/01')
  })
})
