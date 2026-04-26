import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick, h } from 'vue'

vi.mock('virtua/vue', () => ({
  VList: {
    props: ['data'],
    setup(props: any, { slots }: any) {
      return () => h('div', {}, props.data.map((item: any) => slots.default?.({ item })))
    },
  },
}))

import JustifiedGrid from '../components/gallery/JustifiedGrid.vue'

const photo = (id: string, w: number, h: number) => ({
  id, src: { thumb: `${id}/thumb.webp`, large: `${id}/large.webp` },
  w, h, blurhash: 'L', albums: [], tags: [], takenAt: '2025-04-01T00:00:00Z',
})

describe('JustifiedGrid', () => {
  it('renders one cell per photo', async () => {
    const w = mount(JustifiedGrid, {
      props: { photos: [photo('a', 600, 400), photo('b', 400, 600), photo('c', 800, 600)] },
      attachTo: document.body,
    })
    Object.defineProperty(w.element, 'clientWidth', { value: 1000, configurable: true })
    w.vm.$.exposed?.recompute?.()
    await nextTick()
    expect(w.findAll('.justified-grid__cell').length).toBe(3)
  })

  it('emits click with photo id', async () => {
    const w = mount(JustifiedGrid, {
      props: { photos: [photo('a', 600, 400)] },
      attachTo: document.body,
    })
    Object.defineProperty(w.element, 'clientWidth', { value: 1000, configurable: true })
    w.vm.$.exposed?.recompute?.()
    await nextTick()
    await w.find('.justified-grid__cell').trigger('click')
    expect(w.emitted('click')?.[0]).toEqual(['a'])
  })
})
