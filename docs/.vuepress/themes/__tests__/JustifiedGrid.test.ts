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
  Virtualizer: {
    props: ['data', 'itemSize', 'bufferSize', 'scrollRef', 'startMargin'],
    setup(props: any, { slots, attrs }: any) {
      return () => h(
        'div',
        {
          ...attrs,
          'data-virtualizer': 'container',
          'data-item-size': props.itemSize,
          'data-buffer-size': props.bufferSize,
          'data-start-margin': props.startMargin,
          'data-has-scroll-ref': String(Boolean(props.scrollRef)),
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

  it('virtualizes rows against a scroll container', async () => {
    const scrollRef = document.createElement('div')
    const w = mount(JustifiedGrid, {
      props: { photos: [photo('a', 600, 400), photo('b', 400, 600), photo('c', 800, 600)], scrollRef },
      attachTo: document.body,
    })
    Object.defineProperty(w.element, 'clientWidth', { value: 1000, configurable: true })
    w.vm.$.exposed?.recompute?.()
    await nextTick()

    const viewport = w.find('.justified-grid__viewport')
    expect(viewport.attributes('data-virtualizer')).toBe('container')
    expect(viewport.attributes('data-buffer-size')).toBe('900')
    expect(viewport.attributes('data-has-scroll-ref')).toBe('true')
  })

  it('keeps widow rows at their natural width', async () => {
    const w = mount(JustifiedGrid, {
      props: { photos: [photo('a', 600, 400)] },
      attachTo: document.body,
    })
    Object.defineProperty(w.element, 'clientWidth', { value: 1000, configurable: true })
    w.vm.$.exposed?.recompute?.()
    await nextTick()

    expect(w.find('.justified-grid__cell').attributes('style')).not.toContain('width: 1000px')
  })
})
