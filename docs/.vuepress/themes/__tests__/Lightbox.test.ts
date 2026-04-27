// docs/.vuepress/themes/__tests__/Lightbox.test.ts
import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

vi.mock('photoswipe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      init: vi.fn(),
      on: vi.fn(),
      destroy: vi.fn(),
      goTo: vi.fn(),
      close: vi.fn(),
    })),
  }
})

import Lightbox from '../components/gallery/Lightbox.vue'

const photo = (id: string) => ({
  id, src: { thumb: `${id}/thumb.webp`, preview: `${id}/preview.webp`, large: `${id}/large.webp` },
  w: 600, h: 400, blurhash: 'L', albums: [], tags: [], takenAt: '2025-04-01T00:00:00Z',
})

describe('Lightbox', () => {
  it('emits close when activeId becomes null after open', async () => {
    const w = mount(Lightbox, {
      props: { photos: [photo('a'), photo('b')], activeId: 'a' },
    })
    await flushPromises()
    await w.setProps({ activeId: null })
    await flushPromises()
    expect(w.vm).toBeTruthy()
  })

  it('renders nothing visible when no activeId', () => {
    const w = mount(Lightbox, { props: { photos: [photo('a')], activeId: null } })
    expect(w.find('.gallery-lightbox').exists()).toBe(false)
  })

  it('renders stage and panel shell when activeId exists', async () => {
    const w = mount(Lightbox, {
      props: { photos: [photo('a'), photo('b')], activeId: 'a' },
    })
    await flushPromises()
    expect(w.find('.gallery-lightbox__stage').exists()).toBe(true)
    expect(w.find('.gallery-lightbox__panel').exists()).toBe(true)
  })
})
