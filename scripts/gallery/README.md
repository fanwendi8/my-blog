# Gallery 内容工作流

The gallery is markdown-first. Each markdown file in `docs/gallery/*.md` is a story, and the VuePress build reads story metadata directly from frontmatter. Its source images live in a matching story directory under `gallery-staging/`:

```text
gallery-staging/
└── example-story/
    ├── cover.jpg
    ├── 01.jpg
    ├── 02.jpg
    └── order.json
```

`cover.*` (supported image formats are `.jpg`, `.jpeg`, and `.png`) marks the gallery-card cover. It is also a normal story photo and may appear anywhere in the album. `order.json` is optional: when present, its `order` array must list every image path relative to the story directory exactly once; otherwise images use deterministic lexical path order. Nested image paths are supported.

Run this only when adding, removing, or replacing source images in `gallery-staging/`:

```bash
npm run gallery:build
```

The image build writes:

- `docs/.vuepress/public/gallery/data/photos.json`
- `docs/.vuepress/public/gallery-img/<photo-id>-<size>.<format>`

`gallery:build` writes derivatives directly to `docs/.vuepress/public/gallery-img/` and prunes that directory to the current files in `gallery-staging/`. Every story image, including `cover.*`, uses the same derivative output: `thumb.webp` for gallery grids and album thumbnails, plus `large.avif` for story viewing and Lightbox.

## R2 同步

本地生成结果是事实来源，R2 是远端缓存。同步前先生成本地衍生图和 manifest:

```bash
npm run gallery:build
```

检查将要同步和清理的状态:

```bash
npm run gallery:sync -- --dry-run
```

上传缺失的远端对象，并写入远端同步状态:

```bash
npm run gallery:sync
```

删除上次同步状态中存在、但当前 `photos.json` 已不再引用的远端对象:

```bash
npm run gallery:sync -- --prune
```

`gallery:sync` 会在 R2 写入同步状态文件：默认是 `.r2-manifest.json`，设置 `R2_KEY_PREFIX` 后会放到对应前缀下，例如 `story-img/.r2-manifest.json`。它只追踪这个图库脚本管理过的对象。未加 `--prune` 时，历史对象会保留在同步状态里，之后仍可安全清理。

如果 story 图片放在 R2 的 `story-img/` 目录下，设置:

```bash
export R2_KEY_PREFIX="story-img"
export GALLERY_CDN_BASE="https://<your-image-domain>/story-img"
```

此时同步关系是:

```text
本地: docs/.vuepress/public/gallery-img/<photo-id>-large.avif
R2:   story-img/<photo-id>-large.avif
前端: https://<your-image-domain>/story-img/<photo-id>-large.avif
```

普通博客图片如果手动上传到 `blog-img/`，不要放进 `gallery-staging/`，也不要让图库脚本管理。`gallery:sync -- --prune` 只会根据图库同步状态清理 story 图片。

For production, run the full build so the ignored generated gallery assets exist before VuePress compiles:

```bash
npm run build
```

If production images should also be uploaded to R2 before VuePress compiles:

```bash
npm run gallery:publish
```

## 环境变量

| 变量 | 说明 |
|---|---|
| `R2_ENDPOINT` | 例 `https://<account-id>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` | R2 API token |
| `R2_SECRET_ACCESS_KEY` | R2 API secret |
| `R2_BUCKET` | 存储桶名 |
| `R2_KEY_PREFIX` | R2 对象前缀,例如 `story-img` |
| `R2_PUBLIC_BASE` | 例 `https://img.fanwendi.fun`(也用作前端 `__GALLERY_CDN_BASE__`) |
| `GALLERY_CDN_BASE` | VuePress 编译期注入,前端 `<img>` URL 拼接的前缀 |

## 故事

新增故事时,直接在 `docs/gallery/` 下新建 markdown 文件。文件名就是 story slug,frontmatter 是故事索引的 single source of truth:

```yaml
---
title: Example Story
date: 2025-01-01
location: Beijing
permalink: /gallery/example-story/
pageClass: photo-story-page
---
```

图库首页封面从同 slug 的 `gallery-staging/example-story/cover.*` 自动解析，不再在 frontmatter 中维护图片 ID。缺少 `cover.*` 时，构建器会使用该故事排序后的第一张照片作为封面。

## 图片元数据

如果需要为图片补充 `title`、`alt` 或 `caption`,可在 `gallery-staging/meta.json` 中使用相对 `gallery-staging/` 的路径:

```json
[
  {
    "path": "2026-05-06/01.jpg",
    "title": "昆明湖水面",
    "alt": "傍晚的昆明湖水面与远处云层",
    "caption": "颐和园。2026。"
  }
]
```

路径统一写成 `example-story/01.jpg` 或 `example-story/nested/detail.jpg`。脚本也会兼容反斜杠路径,但不建议在文档里使用本机绝对路径。

## 衍生图

默认生成:

| 文件 | 用途 |
|---|---|
| `thumb.webp` | 长边 480, 图库网格和故事相册缩略图 |
| `large.avif` | 长边 3840, 故事正文和 Lightbox |
