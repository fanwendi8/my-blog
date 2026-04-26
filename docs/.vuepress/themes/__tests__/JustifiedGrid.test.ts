import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import JustifiedGrid from '../components/gallery/JustifiedGrid.vue'

const photo = (id: string, w: number, h: number) => ({
  id, src: { thumb: `${id}/thumb.webp`, large: `${id}/large.webp` },
  w, h, blurhash: 'L', albums: [], tags: [], takenAt: '2025-04-01T00:00:00Z',
})

describe('JustifiedGrid', () => {
  it('renders one tile per photo', async () => {
    const w = mount(JustifiedGrid, {
      props: { photos: [photo('a', 600, 400), photo('b', 400, 600), photo('c', 800, 600)] },
      attachTo: document.body,
    })
    Object.defineProperty(w.element, 'clientWidth', { value: 1000, configurable: true })
    w.vm.$.exposed?.recompute?.()
    await nextTick()
    expect(w.findAll('.photo-tile').length).toBe(3)
  })

  it('emits click with photo id', async () => {
    const w = mount(JustifiedGrid, {
      props: { photos: [photo('a', 600, 400)] },
      attachTo: document.body,
    })
    Object.defineProperty(w.element, 'clientWidth', { value: 1000, configurable: true })
    w.vm.$.exposed?.recompute?.()
    await nextTick()
    await w.find('.photo-tile').trigger('click')
    expect(w.emitted('click')?.[0]).toEqual(['a'])
  })
})
