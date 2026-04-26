/**
 * @see https://theme-plume.vuejs.press/guide/collection/ 查看文档了解配置详情。
 */

import { defineCollection, defineCollections } from 'vuepress-theme-plume'

const blog = defineCollection({
  type: 'post',
  dir: 'blog',
  title: '墨痕',
  link: '/blog/',
  postList: false,
  categories: false,
  tagsText: '萤火',
  archivesText: '流年',
})

const notes = defineCollection({
  type: 'post',
  dir: 'notes',
  linkPrefix: '/notes',
  postList: false,
  title: '集萃',
})

export default defineCollections([
  blog,
  // notes,
])
