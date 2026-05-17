import { nextTick, watch } from 'vue'
import { useRoute } from 'vuepress/client'
import { useData, useHeaders } from 'vuepress-theme-plume/composables'

function shouldResetOutline(matter: Record<string, unknown>) {
  return matter.home === true || (matter.pageLayout != null && matter.pageLayout !== 'doc')
}

export function setupOutlineRouteReset() {
  const route = useRoute()
  const { frontmatter } = useData()
  const headers = useHeaders()

  watch(
    () => route.path,
    () => nextTick(() => {
      if (shouldResetOutline(frontmatter.value))
        headers.value = []
    }),
    { immediate: true },
  )
}
