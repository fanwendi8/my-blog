import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PhotoStoryHeader from '../components/gallery/PhotoStoryHeader.vue'

const frontmatter = vi.hoisted(() => ({
  value: {
    title: '颐和园晚霞',
    date: '2026-05-06',
    location: '北京',
  },
  get title() {
    return this.value.title
  },
  get location() {
    return this.value.location
  },
}))

vi.mock('vuepress/client', () => ({
  usePageFrontmatter: () => frontmatter,
}))

describe('PhotoStoryHeader', () => {
  it('renders title, date, and location from an isolated story fixture', () => {
    const wrapper = mount(PhotoStoryHeader)

    expect(wrapper.get('h1').text()).toBe('颐和园晚霞')
    expect(wrapper.get('time').text()).toContain('2026')
    expect(wrapper.get('.photo-story-header__meta').text()).toContain('北京')
  })
})
