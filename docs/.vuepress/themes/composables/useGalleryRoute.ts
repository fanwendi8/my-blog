// docs/.vuepress/themes/composables/useGalleryRoute.ts
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { GalleryRoute, GalleryTab } from '../components/gallery/types'

const TABS: GalleryTab[] = ['timeline', 'albums', 'tags']

export function parseHash(hash: string): GalleryRoute {
  const out: GalleryRoute = { tab: 'timeline' }
  if (!hash) return out
  const cleaned = hash.startsWith('#') ? hash.slice(1) : hash
  const params = new URLSearchParams(cleaned)
  const tab = params.get('tab') as GalleryTab | null
  if (tab && TABS.includes(tab)) out.tab = tab
  const p = params.get('p'); if (p) out.p = p
  const album = params.get('album'); if (album) out.album = album
  const tag = params.get('tag'); if (tag) out.tag = tag
  return out
}

export function serializeHash(r: GalleryRoute): string {
  const params = new URLSearchParams()
  if (r.tab !== 'timeline') params.set('tab', r.tab)
  if (r.album) params.set('album', r.album)
  if (r.tag) params.set('tag', r.tag)
  if (r.p) params.set('p', r.p)
  const q = params.toString()
  return q ? `#${q}` : ''
}

export function useGalleryRoute() {
  const route = ref<GalleryRoute>({ tab: 'timeline' })

  function pull() {
    if (typeof window !== 'undefined') route.value = parseHash(window.location.hash)
  }

  function push(next: GalleryRoute) {
    if (typeof window === 'undefined') return
    const h = serializeHash(next)
    if (h === (window.location.hash || '')) return
    const url = `${window.location.pathname}${window.location.search}${h}`
    window.history.replaceState(null, '', url)
    // 故意不写 route.value - 单向 push 避免与 hashchange → pull 形成循环;
    // 真正的 route 状态以 hash 为唯一来源,hashchange 触发 pull 才会刷新 route ref。
  }

  function onHashChange() { pull() }

  onMounted(() => {
    pull()
    window.addEventListener('hashchange', onHashChange)
  })
  onBeforeUnmount(() => {
    if (typeof window !== 'undefined') window.removeEventListener('hashchange', onHashChange)
  })

  return { route, push, pull }
}
