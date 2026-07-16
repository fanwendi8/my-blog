# Gallery 相册化改造设计

状态：已确认，待进入实现计划。

## 目标

将 gallery 从“故事长页 + 零散图片组件”改造成以相册为核心的摄影档案：

- gallery 首页是安静、克制的故事索引。
- story 页面以整齐的相框网格展示照片。
- 点击照片后进入当前 story 的连续放大浏览。
- 保留简短叙事，但不让正文压过照片。
- 移除摄影故事页面的评论区。

## 不在本次范围内

- 不新增搜索、筛选、标签或复杂分类交互。
- 不把 gallery 首页改成独立照片瀑布流。
- 不加入下载、分享、全屏等额外 lightbox 操作。
- 不删除旧的 `StoryPhoto`、`StoryPhotos`、`StorySplit` 组件；它们保留为特殊故事的兼容能力。
- 不移除博客和笔记页面的 Giscus 评论。

## 页面与视觉设计

### Gallery 首页

`/gallery/` 采用“极简档案”方向：

- 按年份从新到旧分组。
- 每个 story 使用统一 4:3 封面卡片。
- 卡片显示封面、标题、地点和日期。
- 不显示照片数量，避免首页变成管理界面。
- 卡片保持轻量的 hover 反馈，不使用实体相框、厚重阴影或拟物装饰。
- 故事数量增长后仍沿用同一套年份档案结构。

### Story 页面

页面结构为：

1. 标题、日期、地点。
2. 一段可选的短简介。
3. 一个 `StoryAlbum` 相册组件。
4. 相册末尾的「返回瞳画」入口。

标题和简介保持约 640px 的阅读宽度；相册扩展到约 1080px 的媒体宽度。响应式相册列数为桌面 4 列、平板 3 列、手机 2 列。

相框是版式概念，不做实体拟物化：

- 容器统一为 4:3。
- 图片使用 `contain`，保留完整构图，不裁切。
- 通过统一留白、间距和浅色背景形成秩序。
- 不使用阴影和厚边框。
- caption 仅在存在时显示在相框下方，使用小字号、低对比度文本，不覆盖图片。

### Lightbox

点击任意相框后打开当前 story 的照片集合，而不是只打开单张图片：

- 背景为纯白。
- 图片上下左右保留明显白边。
- 图片使用 1px `#e5e5e5` 细边界区分白色背景，不使用阴影。
- 支持桌面端上一张/下一张、键盘方向键和移动端左右滑动。
- 显示当前序号，例如 `3 / 12`。
- 点击背景或关闭按钮退出。
- 不循环；到达首尾时禁用相应方向。
- 点击后立即打开，先使用当前 `thumb.webp` 作为低成本显示源，`large.avif` 加载完成后替换。

## Markdown 内容模型

新增 `StoryAlbum` 作为 story 的默认图片组件：

```md
<StoryAlbum
  :ids="['id-a', 'id-b', 'id-c']"
  :captions="{ 'id-b': '70 张堆栈', 'id-c': '天空单张 + 地景堆栈' }"
/>
```

- `ids` 决定网格顺序，也决定 lightbox 内的浏览顺序。
- `captions` 是可选的 story-specific 映射；没有 caption 的照片不显示文字。
- 常规 story 只需要 `ids`，避免把 frontmatter 变成结构化照片数据库。
- 标题、日期、地点、封面和 permalink 仍使用现有 frontmatter。

现有《颐和园晚霞》迁移为“精简简介 + 一个 `StoryAlbum`”：保留拍摄背景和地点信息，压缩长篇叙事，移除正文中的提示框和图片间穿插段落。

## 组件与数据流

### `StoryAlbum`

`StoryAlbum` 负责：

- 根据照片 ID 从 `useGalleryData()` 获取照片 metadata。
- 将照片按 `ids` 顺序渲染为 4:3 相框。
- 使用缩略图源渲染网格。
- 将当前 story 的完整照片集合组装为 PhotoSwipe `dataSource`。
- 将显式 caption 合并到网格和 lightbox 展示数据。
- 处理缺失照片 ID：跳过无法解析的项目，不阻塞整个 story 页面。

### PhotoSwipe

现有 `PhotoStoryImage` 的单图打开逻辑需要抽象为可复用的 story-level lightbox 数据源。统一的 PhotoSwipe 配置应满足：

- `loop: false`
- 白色背景和固定内边距
- `bgClickAction: 'close'`
- 允许左右切换和键盘操作
- `wheelToZoom: false`
- 不启用下载、全屏和额外分享操作

网格点击时使用 thumbnail 作为 `msrc` 或初始显示源，large 源作为实际大图源；PhotoSwipe 打开不等待 large 请求完成。

### Story 评论

Giscus 继续保留在全局主题配置中，但 `galleryStoryPagesPlugin` 对所有摄影 story 页面自动设置：

```ts
page.frontmatter.comments = false
```

这样 story 页不渲染底部评论，博客和笔记页面行为不变。

## 图片资源与加载策略

图库构建脚本需要为所有 story 照片生成缩略图，而不只为 cover 生成：

- `thumb.webp`：约 480px 长边，用于首页封面和 story 网格。
- `large.avif`：现有大图规格，用于 PhotoSwipe。

相册网格：

- 只请求 `thumb.webp`。
- 使用原生懒加载和异步解码。
- 未加载完成时显示纯色相框背景，不生成或使用 placeholder。

Lightbox：

- 首先复用已经可用的 thumb 作为即时显示源。
- 仅在用户打开查看器时请求对应的 `large.avif`。
- 不在 story 页面预加载所有 large 图片。

placeholder 相关的 manifest 字段、生成逻辑和组件样式应在实现阶段一并清理，避免留下无效的渐进占位路径。

## 迁移与兼容

- `StoryPhoto`、`StoryPhotos`、`StorySplit` 保留并继续注册。
- 现有 story 内容迁移到 `StoryAlbum`，保证照片顺序与当前 Markdown 顺序一致。
- 首页继续从现有 story frontmatter 读取 title、date、location、cover 和 permalink。
- 如需在首页或测试中展示 story 的照片数量，不作为本次首页 UI 字段；数据层可以暂不扩展 count。

## 验证范围

实现后至少验证：

- `StoryAlbum` 正确按 `ids` 顺序渲染照片、跳过缺失 ID，并正确显示可选 caption。
- 4:3 相框使用 `contain`，竖幅、方形和全景图不被裁切。
- Lightbox 使用当前 story 的完整 dataSource，支持顺序切换、不循环、首尾禁用。
- Lightbox 白色背景、留白、细边界和 thumb-to-large 加载行为符合设计。
- story 页面没有 Giscus 评论，博客和笔记页面仍保留评论。
- 所有 story 图片生成并使用 `thumb.webp`，网格不请求 large。
- gallery 首页仍按年份分组，并显示标题、地点、日期而不显示照片数量。
- 运行图库测试、全量 Vitest 测试和 VuePress 生产构建。
- 使用本地 dev server 检查 `/gallery/`、现有 story、移动端两列网格和 lightbox 关键交互。

## 验收标准

当用户进入 gallery 首页时，看到的是按年份整理的极简故事档案；进入任意 story 后，看到标题、简短简介和完整的 4:3 相册网格。任意照片都能立即打开白底、带留白和明确边界的 story-level lightbox，按顺序浏览且不循环。story 页面底部没有评论区，其他站点内容的评论能力不受影响。
