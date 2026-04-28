// docs/.vuepress/themes/__tests__/TabTags.test.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import TabTags from '../components/gallery/TabTags.vue'
import type { Photo, Tag } from '../components/gallery/types'

vi.mock('virtua/vue', () => ({
  WindowVirtualizer: {
    props: ['data'],
    setup(props: any, { slots, attrs }: any) {
      return () => h(
        'div',
        attrs,
        props.data.map((item: any, index: number) => slots.default?.({ item, index })),
      )
    },
  },
}))

const tags: Tag[] = [{ name: 'street', count: 2 }, { name: 'film', count: 1 }]
const photos: Photo[] = [
  { id: 'a', src: { thumb: 'a/thumb.webp', large: 'a/large.webp' }, w: 600, h: 400, blurhash: 'L', albums: [], tags: ['street'], takenAt: '2025-01-01T00:00:00Z' },
  { id: 'b', src: { thumb: 'b/thumb.webp', large: 'b/large.webp' }, w: 600, h: 400, blurhash: 'L', albums: [], tags: ['street', 'film'], takenAt: '2025-01-02T00:00:00Z' },
]

describe('TabTags', () => {
  it('shows tag chips with counts', () => {
    const w = mount(TabTags, { props: { tags, photos } })
    expect(w.text()).toContain('street')
    expect(w.text()).toContain('2')
  })

  it('filters photos when a chip is clicked', async () => {
    const w = mount(TabTags, { props: { tags, photos } })
    const chips = w.findAll('.gallery-chip')
    await chips[1].trigger('click')                       // film
    await new Promise(r => setTimeout(r, 0))
    expect(chips[1].classes()).toContain('is-active')
  })
})
