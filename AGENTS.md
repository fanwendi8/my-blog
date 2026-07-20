# Agent 项目指南

本文件是项目内 AI 辅助开发的唯一维护入口。Codex 读取根目录 `AGENTS.md`，Claude 通过 `.claude/claude.md` 软链接读取同一份内容。

## 项目概览

这是一个基于 VuePress 2 和 `vuepress-theme-plume` 的个人博客项目，站点语言为中文，品牌名为 `Wendi`。内容、主题配置和图库构建脚本都在同一个仓库中维护。

优先遵循仓库内已有风格：ESM 模块、TypeScript 配置文件、`.mjs` Node 脚本、Markdown 内容使用清晰 frontmatter 和稳定 slug。

## 目录结构

- `docs/`: VuePress 站点内容根目录。
- `docs/blog/`: 博客文章。
- `docs/gallery/`: 图库故事 Markdown，文件名会成为 story slug。
- `docs/notes/`: 笔记内容。
- `docs/.vuepress/`: VuePress 与 Plume 主题配置。
- `docs/.vuepress/config.ts`: VuePress 用户配置，修改后通常会重启 dev server。
- `docs/.vuepress/plume.config.ts`: Plume 主题配置，部分配置支持热更新。
- `docs/.vuepress/theme.ts`: Plume 主题实例、Markdown 增强、Giscus 和 PhotoSwipe 插件配置。
- `docs/.vuepress/navbar.ts`: 导航配置。
- `docs/.vuepress/collections.ts`: Plume collection 配置，目前 `docs/blog/` 作为文章集合，首页路由为 `/`。
- `docs/.vuepress/galleryStories.ts`: 图库相关 Vite 插件。
- `docs/.vuepress/client.ts`: 客户端组件注册、PhotoSwipe 运行时配置和路由修复入口。
- `docs/.vuepress/themes/`: 自定义主题扩展，包括布局、组件、composables、图库 helper、样式和 Vitest 测试。
- `docs/.vuepress/themes/components/gallery/`: 摄影故事 Markdown 可直接使用的组件：`PhotoStoryHeader`、`StoryAlbum`、`StoryPhoto`、`StoryPhotos`、`StorySplit`；`PhotoStoryImage` 是这些组件共用的底层图片组件。
- `docs/.vuepress/themes/gallery/`: 图库数据、图片来源、PhotoSwipe 和 CDN helper；修改这些 helper 时优先运行图库相关主题测试。
- `docs/.vuepress/themes/layouts/`: 自定义页面布局，例如 `GalleryHome` 和 `NotesHome`。
- `gallery-staging/`: 图库源图暂存目录。
- `gallery-staging/meta.json`: 可选的图库图片元数据，路径相对于 `gallery-staging/`。
- `scripts/gallery/`: 图库扫描、派生图、manifest 和上传脚本。
- `scripts/gallery/__tests__/`: 图库相关 Vitest 测试。
- `.github/workflows/docs.yml`: GitHub Pages 构建部署流程。
- `docs/.vuepress/public/gallery-img/`: 生成的图库图片资源。
- `docs/.vuepress/public/gallery/data/photos.json`: 生成的图库照片数据。
- `docs/.vuepress/dist/`: 生产构建输出。

## 常用命令

使用 Node `^20.19.0` 或 `>=22.0.0`。

```bash
npm i
npm run docs:dev
npm run docs:dev-clean
npm run docs:build
npm run docs:preview
npm run gallery:build
npm run gallery:sync
npm run gallery:publish
npm run gallery:test
npm test
npm run build
```

修改图库脚本前后优先运行：

```bash
npm run gallery:test
```

修改站点配置、主题、组件或内容导航后，视影响范围运行：

```bash
npm test
npm run docs:build
```

`npm run build` 会先运行 `gallery:build` 再运行 `docs:build`。`docs:build` 只构建 VuePress，不会重新生成图库衍生图。

## 编辑约定

- 保持现有代码风格：JSON/YAML 两空格缩进，TS 模块使用简洁 named exports，Node 脚本使用 `.mjs`。
- Markdown 内容应包含清晰 frontmatter，并避免轻易改动已有 slug。
- 新增 gallery story 时，在 `docs/gallery/` 下创建类似 `example-story.md` 的文件。
- Plume 的 `<Icon>` 在 Vue 组件中使用时，需要把 Iconify 名称加入 `docs/.vuepress/theme.ts` 的 `markdown.icon.preload`，确保图标在构建时作为本地资源生成；当前 `StoryAlbum` 使用 `material-symbols:arrow-back-rounded`。
- 不要手动编辑构建产物，除非任务明确要求。优先修改源内容、配置或脚本，再重新生成。
- 不要在 `docs/.vuepress/config.ts` 和 `docs/.vuepress/plume.config.ts` 中重复配置同一项；`plume.config.ts` 的配置会覆盖 `config.ts` 中相同主题项。
- 涉及可见页面改动时，尽量用本地 dev server 或 build 结果验证。
- `.claude/claude.md` 是指向根目录 `AGENTS.md` 的软链接；更新项目指南时只编辑 `AGENTS.md`。
- `gallery-staging/`、`docs/.vuepress/public/gallery-img/`、`docs/.vuepress/dist/`、`.playwright-mcp/` 等路径被 git ignore。生成或调试后如果它们变化，通常不要提交。
- 图库 story 页面会由 `galleryStoryPagesPlugin` 默认关闭 aside 和 outline；不要在每篇 story 中重复做同样配置，除非该页面确实需要覆盖。

## 站点与主题扩展

- 站点基础信息在 `docs/.vuepress/config.ts`，品牌名为 `Wendi`，语言为 `zh-CN`，描述为 `Code in verse, chiaroscuro in words.`。
- 主题配置拆在 `docs/.vuepress/theme.ts` 与 `docs/.vuepress/plume.config.ts`。`theme.ts` 负责 Plume 实例级能力，`plume.config.ts` 负责主题外观、profile、navbar 和 collections。
- `docs/.vuepress/theme.ts` 的 `markdown.icon.preload` 负责为 SFC 内直接使用的 Iconify 图标预加载本地 SVG/CSS 数据；Markdown 页面中直接出现的 `<Icon>` 可由 Plume 自动扫描，但组件内图标不要省略 preload。
- Navbar 当前三项是 `墨痕`(`/`)、`片羽`(`/notes/`) 和 `瞳画`(`/gallery/`)。
- Giscus 评论配置在 `docs/.vuepress/theme.ts`；不要把 repo id、category id 等配置复制到其他文件。
- `docs/.vuepress/client.ts` 注册自定义组件和布局，同时调用 `definePhotoSwipeConfig()`、`setupOutlineRouteReset()`、`setupPhotoSwipeClickToClose()`。
- 自定义样式入口为 `docs/.vuepress/themes/styles/index.scss`。新增全局样式时优先放到对应分文件，例如 `_gallery.scss`、`_navbar.scss`、`_blog.scss`。

## 图库流程

图库源图按故事放在 `gallery-staging/<story-slug>/`，不再拆分为独立的 `covers/` 和 `stories/` 目录。每个故事目录可递归包含 `.jpg`、`.jpeg`、`.png` 图片，可选 `order.json` 指定图片相对路径顺序，也可选不区分大小写的 `cover.*` 标记图库卡片封面。封面是故事中的普通照片，可以通过 `order.json` 排在中间；没有 `cover.*` 时使用排序后的第一张照片。`order.json` 一旦存在，必须把所有图片路径各列出一次；缺少时按相对路径的确定性字典序排列。

运行 `npm run gallery:build` 会扫描每个 story 目录，生成带有 `storySlug`、`storyOrder`、`isCover` 和图片尺寸/文案 metadata 的 manifest 及图片派生资源，并清理 `docs/.vuepress/public/gallery-img/` 中不再由当前 staging 引用的文件。

图库相关代码集中在 `scripts/gallery/`：

- `storySources.mjs`: 扫描故事目录及其图片来源。
- `scan.mjs`: 图片哈希与旧版扫描 helper。
- `derivatives.mjs`: 生成图片派生资源。
- `manifest.mjs`: 生成 manifest。
- `uploader.mjs`: 上传逻辑。
- `build.mjs`: 串联图库构建流程。
- `sync.mjs`: 将本地生成结果同步到 R2，并支持 dry-run/prune。
- `config.mjs`: 图库构建配置。

图库故事是 markdown-first：`docs/gallery/*.md` 是故事页面，文件名是 story slug。`galleryStoriesPlugin` 从 frontmatter 读取 `title`、`date`、`location`、可选的旧版 `cover` 和 `permalink`。`cover` 不是必填项；`GalleryHome` 优先使用旧版 frontmatter cover，否则从 manifest 中与 story slug 匹配且 `isCover` 为真的照片解析封面，再回退到最低 `storyOrder` 的照片。

图库故事常用 frontmatter：

```yaml
---
title: Example Story
date: 2026-05-06
location: Beijing
permalink: /gallery/example-story/
pageClass: photo-story-page
---
```

图库 story Markdown 可直接使用这些全局组件：

- `<PhotoStoryHeader />`: 读取页面 frontmatter 渲染故事标题、日期、地点。
- `<StoryAlbum story="..." />`: 自动按 manifest 中该 story 的图片顺序渲染相册。
- `<StoryPhoto id="..." caption="..." />`: 单张照片。
- `<StoryPhotos :ids="['...', '...']" caption="..." />`: 多张横向排列照片。
- `<StorySplit :left="['...']" :right="['...', '...']" reverse vertical caption="..." />`: 分栏/上下布局。

`StoryAlbum` 是新故事的默认自动相册：按 manifest 的 `storySlug` 过滤并按 `storyOrder` 排序，不需要在 Markdown 中逐张维护图片 ID。它使用 `thumb.webp` 渲染相册，点击图片时通过 `large.avif` 打开 PhotoSwipe；照片按原始 `w / h` 计算比例感知的 flex 宽度，每行居中，竖图会自然窄于横图，超宽图可在桌面端占更长的横向跨度。保留 ID 驱动的 `StoryPhoto`、`StoryPhotos` 和 `StorySplit` 用于需要特殊选图或排版的页面。

`StoryAlbum` 底部返回入口的 `.story-album__back-row` 只负责占满一行并居中；真正的 `.story-album__back` 链接只包住 40px 图标热区，不能把整行容器改成链接。默认图标是 Plume Iconify 的 `material-symbols:arrow-back-rounded`。故事页媒体宽度通常最多 1600px，CSS 视口达到 3200px 时最多 2200px；同一断点下返回区域额外上间距为 48px。

底层图片组件使用 `large.avif`，并通过显式链接打开 PhotoSwipe。普通左键打开 PhotoSwipe，修饰键点击和非左键点击保留浏览器原生链接行为。图片本身带 `no-view`，避免被全局 PhotoSwipe 选择器重复接管。

PhotoSwipe 行为集中在：

- `docs/.vuepress/themes/gallery/photoSwipeOptions.ts`: 关闭循环/箭头/双击，点击或背景关闭。
- `docs/.vuepress/themes/gallery/photoSwipeClickToClose.ts`: 将图片区域的 pointer/click 交互和滚轮滚动转成关闭 lightbox。

图库上传和 CDN 相关环境变量包括：

- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_KEY_PREFIX`
- `R2_PUBLIC_BASE`
- `GALLERY_CDN_BASE`

不要把 Cloudflare R2 凭证写入仓库。

R2 同步常用命令：

```bash
npm run gallery:build
npm run gallery:sync -- --dry-run
npm run gallery:sync
npm run gallery:sync -- --prune
```

如果 story 图片发布到 R2 的 `story-img/` 前缀，通常设置：

```bash
export R2_KEY_PREFIX="story-img"
export GALLERY_CDN_BASE="https://img.fanwendi.fun/story-img"
```

`GALLERY_CDN_BASE` 会在 VuePress 编译期注入为 `__GALLERY_CDN_BASE__`，前端通过 `docs/.vuepress/themes/gallery/cdn.ts` 拼出图片 URL。CI 构建时使用 `https://img.fanwendi.fun/story-img`。

## 测试与验证

Vitest 配置位于 `vitest.config.ts`，测试环境为 `jsdom`，并启用 global APIs。

- 只改图库脚本：运行 `npm run gallery:test`。
- 改动共享配置、插件、主题或更广的站点行为：运行 `npm test`，必要时再运行 `npm run docs:build`。
- 改动 PhotoSwipe、图库 story 组件或 `docs/.vuepress/themes/gallery/` helper：至少运行相关 `docs/.vuepress/themes/__tests__/*`，通常直接运行 `npm test` 更稳。
- 改动图库 CDN、构建、manifest 或 R2 同步逻辑：运行 `npm run gallery:test`，必要时再用 `npm run gallery:sync -- --dry-run` 检查远端差异。
- 改动前端视觉或交互时，启动 `npm run docs:dev` 并在浏览器中检查关键页面。
- 改动 GitHub Pages 构建路径、生产 CDN、VuePress 配置或插件时，运行 `npm run docs:build`。

## 发布与 CI

- GitHub Actions 工作流位于 `.github/workflows/docs.yml`，在 `main` push 和手动触发时运行。
- CI 使用 Node 22、`npm ci`、`npm run docs:build`，并部署 `docs/.vuepress/dist` 到 `gh-pages`。
- CI 的 VuePress 构建设置 `GALLERY_CDN_BASE=https://img.fanwendi.fun/story-img`。如果新增依赖本地生成图库资源的页面，确认线上 CDN/R2 已有对应对象。
- 本地完整生产构建使用 `npm run build`；需要先同步 R2 时使用 `npm run gallery:publish`。

## 提交信息

提交信息使用 Conventional Commit 风格，例如：

- `feat(gallery): add photo manifest field`
- `fix(theme): adjust navbar social links`
- `fix(navbar): update gallery entry`
- `style(gallery): refine story layout`
- `chore(images): regenerate gallery assets`

PR 描述应包含改动摘要、验证命令、相关 issue，以及可见页面或图库改动的截图。

从 `dev` 合并回 `main` 时使用 squash merge，保持 `main` 分支提交历史干净、聚合且可读。

## 协作注意事项

- 开始修改前先查看相关文件，不要凭印象改配置。
- 保持改动范围紧凑，避免顺手重构无关文件。
- 如果工作区已有未提交改动，不要回滚他人的修改；只在必要位置增量编辑。
- 遇到生成文件变化时，确认它们是否由本次命令产生，再决定是否纳入结果说明。
