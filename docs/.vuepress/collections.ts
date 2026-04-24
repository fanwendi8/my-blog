/**
 * @see https://theme-plume.vuejs.press/guide/collection/ 查看文档了解配置详情。
 */

import { defineCollection, defineCollections } from 'vuepress-theme-plume'

const blog = defineCollection({
  type: 'post',
  dir: 'blog',
  title: '墨痕',
  link: '/blog/',
})

const notes = defineCollection({
  type: 'doc',
  dir: 'notes',
  linkPrefix: '/notes',
  title: '集萃',
  sidebar: 'auto',
})

export default defineCollections([
  blog,
  notes,
])
