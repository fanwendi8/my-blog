import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick, h } from 'vue'

vi.mock('virtua/vue', () => ({
  VList: {
    props: ['data', 'itemSize'],
    setup(props: any, { slots, attrs }: any) {
      return () => h(
        'div',
        { ...attrs, 'data-item-size': props.itemSize },
        props.data.map((item: any) => slots.default?.({ item })),
      )
    },
  },
  WindowVirtualizer: {
    props: ['data', 'itemSize', 'bufferSize'],
    setup(props: any, { slots, attrs }: any) {
      return () => h(
        'div',
        {
          ...attrs,
          'data-virtualizer': 'window',
          'data-item-size': props.itemSize,
          'data-buffer-size': props.bufferSize,
        },
        props.data.map((item: any, index: number) => slots.default?.({ item, index })),
      )
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

  it('uses a classed viewport instead of hard-coded inline scrolling', async () => {
    const w = mount(JustifiedGrid, {
      props: { photos: [photo('a', 600, 400), photo('b', 400, 600)] },
      attachTo: document.body,
    })
    Object.defineProperty(w.element, 'clientWidth', { value: 1000, configurable: true })
    w.vm.$.exposed?.recompute?.()
    await nextTick()

    const viewport = w.find('.justified-grid__viewport')
    expect(viewport.exists()).toBe(true)
    expect(viewport.attributes('style') ?? '').not.toContain('overflow-y')
    expect(viewport.attributes('style') ?? '').not.toContain('60vh')
  })

  it('virtualizes rows against window scroll', async () => {
    const w = mount(JustifiedGrid, {
      props: { photos: [photo('a', 600, 400), photo('b', 400, 600), photo('c', 800, 600)] },
      attachTo: document.body,
    })
    Object.defineProperty(w.element, 'clientWidth', { value: 1000, configurable: true })
    w.vm.$.exposed?.recompute?.()
    await nextTick()

    const viewport = w.find('.justified-grid__viewport')
    expect(viewport.attributes('data-virtualizer')).toBe('window')
    expect(viewport.attributes('data-buffer-size')).toBe('900')
  })
})
