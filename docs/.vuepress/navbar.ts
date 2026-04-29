/**
 * @see https://theme-plume.vuejs.press/config/navigation/ 查看文档了解配置详情
 *
 * Navbar 配置文件，它在 `.vuepress/plume.config.ts` 中被导入。
 */

import { defineNavbarConfig } from 'vuepress-theme-plume'

export default defineNavbarConfig([
  { text: '星痕', link: '/blog/', icon: "solar:documents-linear" },
  { text: '萤火', link: '/blog/tags/', icon: "solar:tag-linear" },
  { text: '流年', link: '/blog/archives/', icon: "solar:calendar-linear" },
  { text: '片羽', link: '/notes/', icon: "solar:notes-linear" },
  { text: '瞳画', link: '/gallery/', icon: "solar:gallery-linear" },
])
