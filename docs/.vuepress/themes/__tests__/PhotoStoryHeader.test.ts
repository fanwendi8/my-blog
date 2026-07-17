import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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

  it('gives story text, headers, and text containers the album media width', () => {
    const styles = readFileSync(resolve(process.cwd(), 'docs/.vuepress/themes/styles/_gallery.scss'), 'utf8')
    const headerRule = styles.match(/\.photo-story-header\s*\{([^}]*)\}/)?.[1] ?? ''
    const metadataRule = styles.match(/\.photo-story-header__meta\s*\{([^}]*)\}/)?.[1] ?? ''
    const textRule = styles.match(
      /\.photo-story-page \.vp-doc > p,[\s\S]*?\.photo-story-page \.vp-doc > div > \.hint-container\s*\{([^}]*)\}/,
    )?.[1] ?? ''
    const textContainerRule = styles.match(
      /\.photo-story-page \.vp-doc \.hint-container,\s*\.photo-story-page \.vp-doc details\s*\{([^}]*)\}/,
    )?.[1] ?? ''
    const paragraphRule = styles.match(
      /\.photo-story-page \.vp-doc > p,\s*\.photo-story-page \.vp-doc > div > p\s*\{([^}]*)\}/,
    )?.[1] ?? ''
    const mobileIntroRule = styles.match(
      /@media\s*\(max-width:\s*719px\)[\s\S]*?\.photo-story-page \.vp-doc > p,\s*\.photo-story-page \.vp-doc > div > p\s*\{([^}]*)\}/,
    )?.[1] ?? ''

    expect(headerRule).toMatch(/max-width:\s*var\(--story-media-width\)/)
    expect(headerRule).toMatch(/margin:\s*12px 0 28px/)
    expect(headerRule).toMatch(/text-align:\s*left/)
    expect(metadataRule).toMatch(/justify-content:\s*flex-start/)
    expect(textRule).toMatch(/max-width:\s*var\(--story-media-width\)/)
    expect(textContainerRule).toMatch(/max-width:\s*var\(--story-media-width\)/)
    expect(paragraphRule).toMatch(/margin:\s*0 auto 28px 0/)
    expect(mobileIntroRule).toMatch(/margin-bottom:\s*28px/)
    expect(styles).not.toMatch(/--story-text-width/)
  })
})
