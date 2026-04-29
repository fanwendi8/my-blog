// docs/.vuepress/themes/__tests__/GalleryTabs.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import GalleryTabs from '../components/gallery/GalleryTabs.vue'

describe('GalleryTabs', () => {
  it('marks the active tab', () => {
    const w = mount(GalleryTabs, { props: { modelValue: 'albums' } })
    const active = w.find('.gallery-tab.is-active')
    expect(active.text()).toBe('专辑')
  })

  it('emits update:modelValue when a tab is clicked', async () => {
    const w = mount(GalleryTabs, { props: { modelValue: 'timeline' } })
    await w.findAll('.gallery-tab')[1].trigger('click')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['albums'])
  })

  it('moves the glow with transform instead of layout offsets', async () => {
    const w = mount(GalleryTabs, { props: { modelValue: 'timeline' } })
    const tabs = w.findAll('.gallery-tab')
    Object.defineProperty(tabs[1].element, 'offsetLeft', { value: 120, configurable: true })
    Object.defineProperty(tabs[1].element, 'offsetTop', { value: 4, configurable: true })
    Object.defineProperty(tabs[1].element, 'offsetWidth', { value: 112, configurable: true })
    Object.defineProperty(tabs[1].element, 'offsetHeight', { value: 40, configurable: true })

    await w.setProps({ modelValue: 'albums' })
    await nextTick()
    await nextTick()

    const style = w.find('.gallery-tabs__glow').attributes('style') ?? ''
    expect(style).toContain('transform: translate3d(120px, 4px, 0px)')
    expect(style).not.toContain('left: 120px')
  })
})
