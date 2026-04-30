// docs/.vuepress/themes/__tests__/PhotoInfoPanel.test.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('vuepress-theme-plume/components/VPIcon.vue', () => ({
  default: { name: 'VPIcon', template: '<span />' },
}))

import PhotoInfoPanel from '../components/gallery/PhotoInfoPanel.vue'

const photo = {
  id: 'a', src: { thumb: 'a/thumb.webp', large: 'a/large.webp' },
  w: 6000, h: 4000, blurhash: 'L', albums: [], tags: ['街拍', '胶片'],
  takenAt: '2025-04-23T17:42:11+08:00',
  title: '灵境胡同', desc: '雨后水洼',
  exif: { camera: 'SONY ILCE-7M4', lens: 'FE 35mm F1.4 GM', fl: 35, fn: 2.8, iso: 400, exp: '1/250' },
  gps: { lat: 39.92, lon: 116.40 },
}

describe('PhotoInfoPanel', () => {
  it('renders title, description and exif fields', () => {
    const w = mount(PhotoInfoPanel, { props: { photo } })
    expect(w.text()).toContain('灵境胡同')
    expect(w.text()).toContain('雨后水洼')
    expect(w.text()).toContain('SONY ILCE-7M4')
    expect(w.text()).toContain('35mm')
    expect(w.text()).toContain('f/2.8')
    expect(w.text()).toContain('ISO 400')
    expect(w.text()).toContain('1/250')
  })

  it('renders tags', () => {
    const w = mount(PhotoInfoPanel, { props: { photo } })
    const tags = w.findAll('.gallery-info__tag')
    expect(tags.map(t => t.text())).toEqual(['街拍', '胶片'])
  })

  it('hides exif block when exif is null', () => {
    const w = mount(PhotoInfoPanel, { props: { photo: { ...photo, exif: null } } })
    expect(w.find('.gallery-info__exif').exists()).toBe(false)
  })

  it('renders gps link when gps present', () => {
    const w = mount(PhotoInfoPanel, { props: { photo } })
    const a = w.find('a.gallery-info__gps')
    expect(a.exists()).toBe(true)
    expect(a.attributes('href')).toContain('39.92')
    expect(a.attributes('href')).toContain('116.4')
  })
})
