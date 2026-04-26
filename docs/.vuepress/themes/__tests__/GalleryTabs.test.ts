// docs/.vuepress/themes/__tests__/GalleryTabs.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GalleryTabs from '../components/gallery/GalleryTabs.vue'

describe('GalleryTabs', () => {
  it('marks the active tab', () => {
    const w = mount(GalleryTabs, { props: { modelValue: 'albums' } })
    const active = w.find('.gallery-tab.is-active')
    expect(active.text()).toBe('专辑')
  })

  it('emits update:modelValue when a tab is clicked', async () => {
    const w = mount(GalleryTabs, { props: { modelValue: 'timeline' } })
    await w.findAll('.gallery-tab')[2].trigger('click')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['tags'])
  })
})
