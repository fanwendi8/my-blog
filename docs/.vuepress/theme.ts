import type { Theme } from 'vuepress'
import { plumeTheme } from 'vuepress-theme-plume'

export const theme: Theme = plumeTheme({
  hostname: 'https://fanwendi.fun',

  markdown: {
    image: {
      // 启用 figure
      figure: true,
      // 启用图片懒加载
      lazyload: true,
      // 启用图片标记
      mark: false,
      // 启用图片大小
      size: true,
    },
    fileTree: true, // :::file-tree  文件树容器
    codeTree: true, // :::code-tree  代码树容器
    plot: true, // !!plot!! 隐秘文本
    npmTo: true, // :::npm-to
    mark: 'lazy',
    demo: true, // :::demo
    field: true, // :::field
    qrcode: true, // @[qrcode](options) 生成二维码
    abbr: true, // 启用缩略语
    table: {
      copy: false,
    }, // 启用表格增强
    timeline: true, // :::timeline
    collapse: true, // :::collapse
    chat: true, // :::chat
    bilibili: true, // @[bilibili](bvid)  嵌入 bilibili 视频
    artPlayer: true, // @[artplayer](options)  嵌入 artplayer 视频
    audioReader: true, // @[audio-reader](options)  嵌入 audio-reader 音频播放器
    codepen: true, // @[codepen](user/slash)  嵌入 codepen
    repl: {
      python: true,
    }, // :::python-repl
    imageSize: true, // 在构建阶段为 图片添加 width/height 属性
    echarts: true, // :::echarts
    mermaid: true, // :::mermaid
  },

  comment: {
    provider: 'Giscus',
    repo: 'fanwendi8/my-blog',
    repoId: 'R_kgDOSLPGGg',
    category: 'Announcements',
    categoryId: 'DIC_kwDOSLPGGs4C7rtV',
  },

  llmstxt: true,
})