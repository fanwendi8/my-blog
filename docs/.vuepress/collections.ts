/**
 * @see https://theme-plume.vuejs.press/guide/collection/ 查看文档了解配置详情。
 */

import { defineCollection, defineCollections } from 'vuepress-theme-plume'

const blog = defineCollection({
  type: 'post',
  dir: 'blog',
  title: '星痕',
  link: '/blog/',
  postList: true,
  categories: false,
  tagsText: '萤火',
  archivesText: '流年',
})

export default defineCollections([
  blog,
])