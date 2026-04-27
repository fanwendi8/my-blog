# 博客与 Gallery 轻盈光影样式设计

日期: 2026-04-27
状态: 已确认设计,待实施计划

## 背景

`tmp/` 下的 AI 设计稿给出了博客与 Gallery 的目标气质:浅色背景、柔和光影、轻量毛玻璃导航、胶囊式控制区、大图卡片和更精致的照片详情面板。设计稿只作为视觉参考,其中的搜索、点赞、视图切换、年份侧栏等演示功能不纳入本次范围。

当前项目基于 VuePress Plume。博客页主要依赖主题默认文章列表和 `docs/.vuepress/themes/styles/_blog.scss`; Gallery 已有自定义组件与样式,包括 `GalleryHome.vue`、`GalleryTabs.vue`、`TabTimeline.vue`、`TabAlbums.vue`、`TabTags.vue`、`JustifiedGrid.vue`、`PhotoTile.vue`、`Lightbox.vue` 和 `_gallery.scss`。

## 目标

- 让博客页和 Gallery 页统一为“轻盈光影版”视觉语言。
- 保持现有数据流、路由、PhotoSwipe、虚拟列表和构建脚本不变。
- 只做样式与必要的轻量模板调整,不新增业务功能。
- 保证桌面与移动端布局稳定,文本不重叠,图片网格性能不退化。

## 非目标

- 不实现搜索功能。
- 不新增点赞数、收藏、浏览量或社交互动。
- 不新增 Gallery 网格/列表切换。
- 不新增设计稿中的年份时间线侧栏。
- 不改 Gallery manifest、R2/CDN 路径、图片衍生图脚本。

## 视觉方向

采用“轻盈光影版”:

- 背景使用白色到极浅暖色/冷色的柔和层次,避免重色块和单一紫色调。
- 导航和控制区使用半透明白底、细边框、低强度阴影。
- 主要按钮、Tabs、标签使用胶囊或小圆角,强调色控制在橙色与紫色点缀。
- 图片卡片保留照片主体,只加轻微圆角、悬浮提升和底部信息渐层。
- 详情面板使用明亮白底,通过分隔线、标签胶囊和表格式 EXIF 提升秩序感。

## 博客页设计

博客页保留 Plume 默认列表结构,以 CSS 覆盖为主。

- `is-posts` 容器改为柔和光影背景,移除当前偏重的方格背景。
- 文章列表项改为轻卡片:白底、细边框、8px 左右圆角、弱阴影、hover 轻微上浮。
- 文章标题保持可读优先,字号不做夸张放大。
- 标签、日期、摘要、分页等辅助元素使用低对比度文字和浅色胶囊。
- 暗色模式保持可读,不强行套用浅色面板。

## Gallery 首页设计

Gallery 保持现有三 Tab 信息架构。

- `GalleryHome.vue` 顶部标题区增加轻量视觉层次:标题“瞳画”、星点装饰、作品数量。
- `GalleryTabs.vue` 保持现有 DOM 与事件,样式改为分段胶囊,选中态使用白底、细阴影和紫色下边强调。
- 时间线视图继续使用 `JustifiedGrid`;样式只调整间距、圆角、hover 和图片暗部信息层。
- 标签视图的 chips 改为浅色胶囊,选中态使用柔和品牌色。
- 专辑视图改为更接近设计稿的大图封面卡:封面图占主视觉,标题与数量叠加或紧贴封面底部。

## Gallery 图片与 Lightbox

- `PhotoTile.vue` 可增加只读展示信息层,例如标题、日期和标签;不增加交互状态。
- `JustifiedGrid.vue` 保持虚拟列表高度和 justified layout 逻辑,必要时只通过 class/style 调整视觉间距。
- `Lightbox.vue` 保持 PhotoSwipe 初始化逻辑不变。
- `_gallery.scss` 将 lightbox 从纯黑全屏改为“柔和舞台 + 明亮信息面板”的效果。
- `PhotoInfoPanel.vue` 保持字段来源不变,样式改为标题、日期、描述、EXIF、标签、地图链接分区展示。
- 移动端 lightbox 仍上下布局,信息面板高度受限,避免遮挡图片。

## 响应式与可访问性

- 桌面宽度保持 Gallery 最大内容宽度约 1280px 到 1440px。
- 小屏下标题区和 Tabs 自然换行,不出现横向溢出。
- 所有按钮保留可点击语义和可见焦点态。
- 图片 hover 效果不作为唯一信息来源。
- 文本字号不使用 viewport 宽度缩放。

## 测试与验收

- `npm run test` 或至少相关 Gallery 单测通过。
- `npm run docs:build` 成功。
- 使用浏览器检查 `/blog/`、`/blog/tags/`、`/blog/archives/`、`/gallery/`。
- 检查桌面和移动视口下无明显重叠、溢出或空白异常。
- Lightbox 可打开、切换、关闭,右侧信息面板正常显示。

## 文件范围

预计修改:

- `docs/.vuepress/themes/styles/_navbar.scss`
- `docs/.vuepress/themes/styles/_blog.scss`
- `docs/.vuepress/themes/styles/_gallery.scss`
- `docs/.vuepress/themes/layouts/GalleryHome.vue`
- `docs/.vuepress/themes/components/gallery/PhotoTile.vue`
- `docs/.vuepress/themes/components/gallery/TabAlbums.vue`
- `docs/.vuepress/themes/components/gallery/PhotoInfoPanel.vue`

不预计修改:

- `scripts/gallery/`
- `docs/.vuepress/public/gallery/data/`
- `docs/.vuepress/public/gallery-img/`
- `package.json`
