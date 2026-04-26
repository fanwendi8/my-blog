/**
 * 查看以下文档了解主题配置
 * - @see https://theme-plume.vuejs.press/config/intro/ 配置说明
 * - @see https://theme-plume.vuejs.press/config/theme/ 主题配置项
 *
 * 请注意，对此文件的修改都会重启 vuepress 服务。
 * 部分配置项的更新没有必要重启 vuepress 服务，建议请在 `.vuepress/config.ts` 文件中配置
 *
 * 特别的，请不要在两个配置文件中重复配置相同的项，当前文件的配置项会被覆盖
 */

import { viteBundler } from '@vuepress/bundler-vite'
import { defineUserConfig } from 'vuepress'
import { theme } from './theme.ts'

export default defineUserConfig({
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }],
  ],

  base: '/',
  lang: 'zh-CN',
  title: '𝓦𝓮𝓷𝓭𝓲',
  description: '代码如诗，光影为辞',

  bundler: viteBundler({
    viteOptions: {
      define: {
        __GALLERY_CDN_BASE__: JSON.stringify(process.env.GALLERY_CDN_BASE ?? ''),
      },
    },
  }),

  theme,
})
