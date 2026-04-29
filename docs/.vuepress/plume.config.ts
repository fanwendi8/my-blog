/**
 * 查看以下文档了解主题配置
 * - @see https://theme-plume.vuejs.press/config/intro/ 配置说明
 * - @see https://theme-plume.vuejs.press/config/theme/ 主题配置项
 *
 * 请注意，对此文件的修改不会重启 vuepress 服务，而是通过热更新的方式生效
 * 但同时部分配置项不支持热更新，请查看文档说明
 * 对于不支持热更新的配置项，请在 `.vuepress/config.ts` 文件中配置
 *
 * 特别的，请不要在两个配置文件中重复配置相同的项，当前文件的配置项会覆盖 `.vuepress/config.ts` 文件中的配置
 */

import { defineThemeConfig } from 'vuepress-theme-plume'
import navbar from './navbar'
import collections from './collections'

/**
 * @see https://theme-plume.vuejs.press/config/theme/
 */
export default defineThemeConfig({
  logo: '/logo.png',

  appearance: false,

  tagText: '萤火',
  archiveText: '流年',

  social: [
    { icon: 'github', link: 'https://github.com/fanwendi8' },
    { icon: 'xbox', link: 'https://www.xbox.com/play/user/FanWendi8' },
  ],

  /* 站点页脚 */
  footer: {
    message: '',
    copyright: 'Copyright © 2026 𝓦𝓮𝓷𝓭𝓲',
  },

  /**
   * @see https://theme-plume.vuejs.press/config/theme/#profile
   */
  profile: {
    avatar: '/logo.png',
    name: '𝓦𝓮𝓷𝓭𝓲',
    description: '代码如诗，光影为辞',
    location: '𝐵𝑒𝒾𝒥𝒾𝓃𝑔, 𝒞𝒽𝒾𝓃𝒶',
  },

  navbar,
  collections,
})
