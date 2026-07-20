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

  it('aligns story text with the full media column', () => {
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
    const desktopWideIntroRule = styles.match(
      /@media\s*\(min-width:\s*1280px\)[\s\S]*?\.photo-story-page \.vp-doc > p,\s*\.photo-story-page \.vp-doc > div > p\s*\{([^}]*)\}/,
    )?.[1] ?? ''

    expect(headerRule).toMatch(/max-width:\s*var\(--story-media-width\)/)
    expect(headerRule).toMatch(/margin:\s*10px 0 18px/)
    expect(headerRule).toMatch(/text-align:\s*left/)
    expect(metadataRule).toMatch(/justify-content:\s*flex-start/)
    expect(metadataRule).toMatch(/margin:\s*12px 0 0/)
    expect(metadataRule).toMatch(/line-height:\s*1\.35/)
    expect(textRule).toMatch(/max-width:\s*var\(--story-media-width\)/)
    expect(textContainerRule).toMatch(/max-width:\s*var\(--story-media-width\)/)
    expect(paragraphRule).toMatch(/max-width:\s*var\(--story-media-width\)/)
    expect(paragraphRule).toMatch(/margin:\s*0 0 18px/)
    expect(paragraphRule).toMatch(/line-height:\s*1\.6/)
    expect(mobileIntroRule).toMatch(/margin-bottom:\s*18px/)
    expect(mobileIntroRule).toMatch(/line-height:\s*1\.55/)
    expect(desktopWideIntroRule).toMatch(/line-height:\s*1\.6/)
    expect(styles).not.toMatch(/--story-text-width/)
    expect(styles).toMatch(/--story-media-width:\s*min\(1600px,\s*calc\(100vw - 96px\)\)/)
    expect(styles).toMatch(/@media\s*\(min-width:\s*3200px\)[\s\S]*--story-media-width:\s*min\(2200px,\s*calc\(100vw - 96px\)\)/)
    expect(styles).toMatch(/html:has\(\.photo-story-page\) \.photo-story-page\s*\{\s*min-height:\s*auto/)
    expect(styles).toMatch(/--story-wall-color:\s*#fff/)
    expect(styles).toMatch(/background-color:\s*var\(--story-wall-color\)/)
    expect(styles).toMatch(/background-image:\s*none/)
  })
})
