// docs/.vuepress/themes/__tests__/PhotoTile.test.ts
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PhotoTile from '../components/gallery/PhotoTile.vue'
import { decode } from 'blurhash'

vi.mock('blurhash', () => ({
  decode: vi.fn(() => new Uint8ClampedArray(32 * 21 * 4)),
}))

const photo = {
  id: 'a', src: { thumb: 'a/thumb.webp', large: 'a/large.webp' },
  w: 600, h: 400, blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4', albums: [], tags: [], takenAt: '2025-04-01T00:00:00Z',
}

let intersectionCallback: IntersectionObserverCallback | null = null

class MockIntersectionObserver {
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()

  constructor(callback: IntersectionObserverCallback) {
    intersectionCallback = callback
  }
}

Object.defineProperty(window, 'IntersectionObserver', {
  configurable: true,
  writable: true,
  value: MockIntersectionObserver,
})

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    createImageData: vi.fn((w: number, h: number) => ({
      data: new Uint8ClampedArray(w * h * 4),
    })),
    putImageData: vi.fn(),
  } as unknown as CanvasRenderingContext2D)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  intersectionCallback = null
})

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

  it('defers blurhash decoding until the tile approaches the viewport', () => {
    const w = mount(PhotoTile, { props: { photo, width: 220, height: 146 } })
    expect(decode).not.toHaveBeenCalled()

    intersectionCallback?.([
      { isIntersecting: true, target: w.element } as IntersectionObserverEntry,
    ], {} as IntersectionObserver)

    expect(decode).toHaveBeenCalledTimes(1)
  })
})
