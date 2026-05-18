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
- `docs/.vuepress/navbar.ts`: 导航配置。
- `docs/.vuepress/galleryStories.ts`: 图库相关 Vite 插件。
- `gallery-staging/`: 图库源图暂存目录。
- `scripts/gallery/`: 图库扫描、派生图、manifest 和上传脚本。
- `scripts/gallery/__tests__/`: 图库相关 Vitest 测试。
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
npm run gallery:test
npm test
```

修改图库脚本前后优先运行：

```bash
npm run gallery:test
```

修改站点配置、主题、组件或内容导航后，视影响范围运行：

```bash
npm run docs:build
```

## 编辑约定

- 保持现有代码风格：JSON/YAML 两空格缩进，TS 模块使用简洁 named exports，Node 脚本使用 `.mjs`。
- Markdown 内容应包含清晰 frontmatter，并避免轻易改动已有 slug。
- 新增 gallery story 时，在 `docs/gallery/` 下创建类似 `example-story.md` 的文件。
- 不要手动编辑构建产物，除非任务明确要求。优先修改源内容、配置或脚本，再重新生成。
- 不要在 `docs/.vuepress/config.ts` 和 `docs/.vuepress/plume.config.ts` 中重复配置同一项；`plume.config.ts` 的配置会覆盖 `config.ts` 中相同主题项。
- 涉及可见页面改动时，尽量用本地 dev server 或 build 结果验证。

## 图库流程

图库源图放在 `gallery-staging/`。运行 `npm run gallery:build` 会根据脚本生成图库 metadata 和图片派生资源。

图库相关代码集中在 `scripts/gallery/`：

- `scan.mjs`: 扫描源图片。
- `derivatives.mjs`: 生成图片派生资源。
- `manifest.mjs`: 生成 manifest。
- `uploader.mjs`: 上传逻辑。
- `build.mjs`: 串联图库构建流程。
- `config.mjs`: 图库构建配置。

图库上传和 CDN 相关环境变量包括：

- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_BASE`
- `GALLERY_CDN_BASE`

不要把 Cloudflare R2 凭证写入仓库。

## 测试与验证

Vitest 配置位于 `vitest.config.ts`，测试环境为 `jsdom`，并启用 global APIs。

- 只改图库脚本：运行 `npm run gallery:test`。
- 改动共享配置、插件、主题或更广的站点行为：运行 `npm test`，必要时再运行 `npm run docs:build`。
- 改动前端视觉或交互时，启动 `npm run docs:dev` 并在浏览器中检查关键页面。

## 提交信息

提交信息使用 Conventional Commit 风格，例如：

- `feat(gallery): add photo manifest field`
- `fix(theme): adjust navbar social links`
- `fix(navbar): update gallery entry`
- `style(gallery): refine story layout`
- `chore(images): regenerate gallery assets`

PR 描述应包含改动摘要、验证命令、相关 issue，以及可见页面或图库改动的截图。

## 协作注意事项

- 开始修改前先查看相关文件，不要凭印象改配置。
- 保持改动范围紧凑，避免顺手重构无关文件。
- 如果工作区已有未提交改动，不要回滚他人的修改；只在必要位置增量编辑。
- 遇到生成文件变化时，确认它们是否由本次命令产生，再决定是否纳入结果说明。
