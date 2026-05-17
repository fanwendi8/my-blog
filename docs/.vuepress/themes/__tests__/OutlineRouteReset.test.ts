import { beforeEach, describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { effectScope, reactive, ref } from 'vue'

const route = reactive({ path: '/blog/test/' })
const frontmatter = ref<Record<string, unknown>>({})
const headers = ref([{ title: '旧标题', link: '#old', children: [] }])

beforeEach(() => {
  vi.resetModules()
  route.path = '/blog/test/'
  frontmatter.value = {}
  headers.value = [{ title: '旧标题', link: '#old', children: [] }]

  vi.doMock('vuepress/client', () => ({
    useRoute: () => route,
  }))

  vi.doMock('vuepress-theme-plume/composables', () => ({
    useData: () => ({ frontmatter }),
    useHeaders: () => headers,
  }))
})

describe('OutlineRouteReset', () => {
  it('clears stale article outline when navigating to a home page', async () => {
    const { setupOutlineRouteReset } = await import('../composables/setupOutlineRouteReset')
    const scope = effectScope()
    scope.run(setupOutlineRouteReset)

    frontmatter.value = { home: true }
    route.path = '/'
    await flushPromises()

    expect(headers.value).toEqual([])
    scope.stop()
  })

  it('keeps outline state for document pages so the theme can refresh it from content', async () => {
    const { setupOutlineRouteReset } = await import('../composables/setupOutlineRouteReset')
    headers.value = [{ title: '文章标题', link: '#title', children: [] }]
    frontmatter.value = {}
    route.path = '/blog/test/'

    const scope = effectScope()
    scope.run(setupOutlineRouteReset)
    await flushPromises()

    expect(headers.value).toHaveLength(1)
    scope.stop()
  })
})
