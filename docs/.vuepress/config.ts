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
import { galleryPhotosPlugin, galleryStoriesPlugin, galleryStoryPagesPlugin } from './galleryStories.ts'
import { theme } from './theme.ts'

export default defineUserConfig({
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }],
    ['link', { rel: 'preload', href: '/fonts/ZWZT.woff2', as: 'font', type: 'font/woff2', crossorigin: '' }],
    ['link', { rel: 'preload', href: '/fonts/FiraCode-Regular.woff2', as: 'font', type: 'font/woff2', crossorigin: '' }],
  ],

  base: '/',
  lang: 'zh-CN',
  title: 'Wendi',
  description: 'Code in verse, chiaroscuro in words.',
  plugins: [
    galleryStoryPagesPlugin(new URL('../gallery', import.meta.url).pathname),
  ],

  bundler: viteBundler({
    viteOptions: {
      define: {
        __GALLERY_CDN_BASE__: JSON.stringify(process.env.GALLERY_CDN_BASE ?? ''),
      },
      plugins: [
        galleryStoriesPlugin(new URL('../gallery', import.meta.url).pathname),
        galleryPhotosPlugin(new URL('./public/gallery/data/photos.json', import.meta.url).pathname),
      ],
    },
  }),

  theme,
})
