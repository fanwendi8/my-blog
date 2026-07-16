# Gallery Album Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 gallery 首页和摄影 story 页面实现为极简档案 + 4:3 相册，并提供白底、不循环的 story-level PhotoSwipe 浏览。

**Architecture:** 保留现有 Markdown-first story 和旧图片布局组件，新增单一职责的 `StoryAlbum` 负责网格渲染、caption 映射和当前 story 的 lightbox data source。图库构建为所有照片提供 `thumb.webp` 与 `large.avif`，网格只使用 thumb，放大查看时使用 large；评论通过 gallery story page plugin 关闭。

**Tech Stack:** Vue 3、VuePress 2、TypeScript、PhotoSwipe 5、Vite、Vitest、Sharp、SCSS。

## Global Constraints

- Node 使用项目要求的 `^20.19.0 || >=22.0.0`；当前环境 Node 22.17.0 可能出现 VuePress engine warning，但不得因该 warning 修改依赖版本。
- gallery 页面保持中文站点与现有 `Wendi` 品牌语气。
- 4:3 相框中的图片必须使用 `contain`，不裁切任何摄影作品。
- story lightbox 使用纯白背景、白色留白、1px `#e5e5e5` 图片边界，不循环。
- story 页设置 `comments: false`；博客和笔记页继续使用全局 Giscus。
- 不删除 `StoryPhoto`、`StoryPhotos`、`StorySplit` 旧组件。
- 不手动提交 `docs/.vuepress/public/gallery-img/`、`dist/` 或其他被 gitignore 的构建产物。
- 每个实现任务遵循 RED → GREEN → REFACTOR，并在任务结束运行该任务的测试。

## File Map

### Gallery pipeline

- Modify `scripts/gallery/config.mjs`: 为 story 角色增加 480px `thumb.webp` 衍生图。
- Modify `scripts/gallery/derivatives.mjs`: 删除 placeholder 生成逻辑，保留通用衍生图生成。
- Modify `scripts/gallery/build.mjs`: manifest 不再写入 `placeholder` 和 `bg`。
- Modify `scripts/gallery/README.md`: 同步资源字段和加载说明。
- Modify `scripts/gallery/__tests__/derivatives.test.mjs` and `scripts/gallery/__tests__/build.test.mjs`: 覆盖新的 story 衍生图和无 placeholder manifest 行为。
- Create `scripts/gallery/__tests__/config.test.mjs`: 锁定 cover/story 衍生图规格。

### Gallery data and components

- Modify `docs/.vuepress/themes/gallery/types.ts`: 移除 `Photo.placeholder` 和 `Photo.bg`。
- Modify `docs/.vuepress/themes/gallery/photoSources.ts`: 保持 legacy source 兼容，同时让新 manifest 的 story 图片优先使用 thumb。
- Create `docs/.vuepress/themes/gallery/storyPhotoSwipe.ts`: 将 story photo IDs 转成 PhotoSwipe slide data 的纯函数。
- Create `docs/.vuepress/themes/components/gallery/StoryAlbum.vue`: 渲染相册网格、caption、返回入口，并启动 story-level lightbox。
- Modify `docs/.vuepress/themes/components/gallery/PhotoStoryImage.vue`: 移除 placeholder/background-style 逻辑，保留旧组件的大图行为。
- Modify `docs/.vuepress/themes/layouts/GalleryHome.vue`: 移除 placeholder style，保留极简档案卡片。
- Modify `docs/.vuepress/client.ts`: 注册 `StoryAlbum`。

### Visual system, page behavior, and content

- Modify `docs/.vuepress/themes/gallery/photoSwipeOptions.ts`: 开启键盘和相册导航，保留白底、不循环和关闭行为。
- Modify `docs/.vuepress/themes/styles/_gallery.scss`: 实现 4:3、4/3/2 列、story 宽度层级、白底 lightbox 和可见导航。
- Modify `docs/.vuepress/galleryStories.ts`: 为 story page 自动设置 `comments: false`。
- Modify `docs/gallery/2026-05-06.md`: 迁移为精简简介 + `StoryAlbum`。
- Modify `docs/.vuepress/themes/components/gallery/README.md`: 记录新组件 API，并保留旧组件说明。

### Tests

- Modify `docs/.vuepress/themes/__tests__/galleryStories.test.ts`: 断言 story page 关闭评论，移除 placeholder fixture 字段。
- Modify `docs/.vuepress/themes/__tests__/GalleryHome.test.ts`: 断言首页卡片不依赖 placeholder style。
- Modify `docs/.vuepress/themes/__tests__/PhotoStoryLayoutComponents.test.ts`: 保持旧组件行为，并增加 `StoryAlbum` 渲染覆盖。
- Create `docs/.vuepress/themes/__tests__/storyPhotoSwipe.test.ts`: 覆盖 ID 顺序、missing ID、thumb/large source 和 caption precedence。
- Create `docs/.vuepress/themes/__tests__/StoryAlbum.test.ts`: 覆盖网格、caption、返回入口和点击后 story data source。
- Modify `docs/.vuepress/themes/__tests__/photoSources.test.ts` and `photoSwipeOptions.test.ts`: 锁定资源与导航行为。

---

### Task 1: 为所有图库照片生成 thumb，并移除 placeholder manifest

**Files:**
- Modify: `scripts/gallery/config.mjs`
- Modify: `scripts/gallery/derivatives.mjs`
- Modify: `scripts/gallery/build.mjs`
- Modify: `scripts/gallery/README.md`
- Create: `scripts/gallery/__tests__/config.test.mjs`
- Modify: `scripts/gallery/__tests__/derivatives.test.mjs`
- Modify: `scripts/gallery/__tests__/build.test.mjs`

**Interfaces:**
- `DERIVATIVES.story` 产生 `{ thumb: { webp, w: 480 }, large: { avif, w: 3840 } }`。
- `build.mjs` 写入的每个 photo record 只包含 `id`、`src`、`w`、`h`、`title`、`alt`、`caption`。
- `generateDerivatives()` 继续接受任意 derivative specs 并返回同形状 manifest。

- [ ] **Step 1: 写失败测试，锁定 story derivative specs**

在 `scripts/gallery/__tests__/config.test.mjs` 写入：

```js
import { describe, expect, it } from 'vitest'
import { DERIVATIVES } from '../config.mjs'

describe('gallery derivative config', () => {
  it('generates thumb and large for story photos', () => {
    expect(DERIVATIVES.story).toEqual([
      { name: 'thumb', width: 480, formats: ['webp'] },
      { name: 'large', width: 3840, formats: ['avif'] },
    ])
  })
})
```

在 `derivatives.test.mjs` 将 `STORY_SPECS` 改为同样的 thumb + large 规格，并将原有 “only generates large for story specs” 测试改名为 “writes thumb and large for story specs”，断言 thumb 文件存在、manifest 包含两个 variant。

- [ ] **Step 2: 运行测试确认 RED**

Run: `npm run gallery:test -- scripts/gallery/__tests__/config.test.mjs scripts/gallery/__tests__/derivatives.test.mjs`

Expected: FAIL，原因是当前 `DERIVATIVES.story` 和测试中的 story spec 仍然只有 `large`。

- [ ] **Step 3: 写最小实现**

在 `config.mjs` 将 story 规格改为：

```js
story: [
  { name: 'thumb', width: 480, formats: ['webp'] },
  { name: 'large', width: 3840, formats: ['avif'] },
],
```

在 `build.mjs`：

- 删除 `generatePlaceholder` import。
- 删除 `isBlurredPlaceholder()` 函数。
- 在已有 photo 分支和新 photo 分支都不再计算 `preview`。
- 从 record 中删除 `...preview`，保留 `title`、`alt`、`caption`。

在 `derivatives.mjs` 删除 `generatePlaceholder`、`svgPlaceholder`、`encodeSvgData`、`rgbToHex`，保留 `generateDerivatives`、`derivativeManifest` 及其尺寸校验函数。

在 `scripts/gallery/README.md` 删除 placeholder/bg 字段说明，明确 cover 与 story 都生成 thumb，large 只用于大图查看。

- [ ] **Step 4: 运行测试确认 GREEN**

Run: `npm run gallery:test -- scripts/gallery/__tests__/config.test.mjs scripts/gallery/__tests__/derivatives.test.mjs`

Expected: PASS。

- [ ] **Step 5: 增加 manifest 无 placeholder 的回归测试并运行**

在 `build.test.mjs` 增加对纯 photo record builder 的测试；如果实现不抽取 builder，则将 `build.mjs` 的 record 组装抽成命名导出 `createPhotoRecord({ id, src, size, fileMeta, previous })`，并测试其结果不含 `placeholder`、`bg`：

```js
expect(createPhotoRecord({
  id: 'story-id',
  src: { thumb: { webp: 'story-thumb.webp', w: 480 }, large: { avif: 'story-large.avif', w: 3840 } },
  size: { w: 1200, h: 900 },
  fileMeta: { title: null, alt: '', caption: null },
  previous: null,
})).toEqual({
  id: 'story-id',
  src: { thumb: { webp: 'story-thumb.webp', w: 480 }, large: { avif: 'story-large.avif', w: 3840 } },
  w: 1200,
  h: 900,
  title: null,
  alt: '',
  caption: null,
})
```

Run: `npm run gallery:test`

Expected: PASS。

- [ ] **Step 6: Commit pipeline change**

```bash
git add scripts/gallery/config.mjs scripts/gallery/derivatives.mjs scripts/gallery/build.mjs scripts/gallery/README.md scripts/gallery/__tests__
git commit -m "feat(gallery): generate story thumbnails without placeholders"
```

### Task 2: 清理前端 placeholder 数据路径并保持图片源兼容

**Files:**
- Modify: `docs/.vuepress/themes/gallery/types.ts`
- Modify: `docs/.vuepress/themes/gallery/photoSources.ts`
- Modify: `docs/.vuepress/themes/components/gallery/PhotoStoryImage.vue`
- Modify: `docs/.vuepress/themes/layouts/GalleryHome.vue`
- Modify: `docs/.vuepress/themes/__tests__/photoSources.test.ts`
- Modify: `docs/.vuepress/themes/__tests__/PhotoStoryLayoutComponents.test.ts`
- Modify: `docs/.vuepress/themes/__tests__/GalleryHome.test.ts`

**Interfaces:**
- `Photo` 不再有 `placeholder` 或 `bg`。
- `thumbSrc(photo)` 返回 photo source 中的 thumb；对旧字符串 source 和旧无 thumb source 保持现有 fallback，避免历史 manifest 立即失效。
- `largeSrc(photo)` 仍返回 large source。

- [ ] **Step 1: 写失败测试**

更新 `photoSources.test.ts` 的 story fixture，加入 thumb：

```ts
const storyPhoto: Photo = {
  id: 'story',
  src: {
    thumb: { webp: 'story-thumb.webp', w: 480 },
    large: { avif: 'story-large.avif', w: 3840 },
  },
  w: 600,
  h: 400,
}
```

并断言 `thumbSrc(storyPhoto)` 为 `/gallery-img/story-thumb.webp`。在 `GalleryHome.test.ts` 为 mock photo 删除 placeholder/bg，并断言封面 img 不含 `background-image` 的 placeholder style。

- [ ] **Step 2: 运行测试确认 RED**

Run: `npm test -- docs/.vuepress/themes/__tests__/photoSources.test.ts docs/.vuepress/themes/__tests__/GalleryHome.test.ts`

Expected: 由于当前 fixture/组件仍然写入 placeholder style，新增断言失败。

- [ ] **Step 3: 写最小实现**

- 从 `Photo` 接口删除 `placeholder`、`bg`。
- 从 `PhotoStoryImage.vue` 删除 `placeholderStyle()` 和 img 的 `:style`，保留 `src`、`alt`、尺寸、lazy、decoding 和 `no-view`。
- 从 `GalleryHome.vue` 删除 `placeholderStyle()` 和封面 img 的 `:style`。
- 将 frontend tests 的 mock manifest 清理为无 placeholder/bg 字段。

- [ ] **Step 4: 运行测试确认 GREEN**

Run: `npm test -- docs/.vuepress/themes/__tests__/photoSources.test.ts docs/.vuepress/themes/__tests__/PhotoStoryLayoutComponents.test.ts docs/.vuepress/themes/__tests__/GalleryHome.test.ts`

Expected: PASS。

- [ ] **Step 5: Commit data cleanup**

```bash
git add docs/.vuepress/themes/gallery docs/.vuepress/themes/components/gallery/PhotoStoryImage.vue docs/.vuepress/themes/layouts/GalleryHome.vue docs/.vuepress/themes/__tests__
git commit -m "refactor(gallery): remove placeholder rendering"
```

### Task 3: 建立 story PhotoSwipe data source 纯函数

**Files:**
- Create: `docs/.vuepress/themes/gallery/storyPhotoSwipe.ts`
- Create: `docs/.vuepress/themes/__tests__/storyPhotoSwipe.test.ts`

**Interfaces:**

```ts
export interface StoryCaptionMap {
  [photoId: string]: string | undefined
}

export function createStoryPhotoSwipeItems(
  photos: Photo[],
  ids: string[],
  captions?: StoryCaptionMap,
): SlideData[]
```

每个返回项包含 `type: 'image'`、large `src`、thumb `msrc`、`width`、`height`、`alt`，并在有 caption 时附加 `caption`。

- [ ] **Step 1: 写失败测试**

在 `storyPhotoSwipe.test.ts` 覆盖：

```ts
it('keeps requested order, skips missing IDs, and combines thumb, large, alt, and caption', () => {
  const items = createStoryPhotoSwipeItems(photos, ['b', 'missing', 'a'], { b: 'Story caption' })

  expect(items).toEqual([
    {
      type: 'image',
      src: '/gallery-img/b-large.avif',
      msrc: '/gallery-img/b-thumb.webp',
      width: 400,
      height: 600,
      alt: 'B',
      caption: 'Story caption',
    },
    {
      type: 'image',
      src: '/gallery-img/a-large.avif',
      msrc: '/gallery-img/a-thumb.webp',
      width: 600,
      height: 400,
      alt: 'A',
    },
  ])
})

it('uses photo metadata caption when a story caption is absent', () => {
  expect(createStoryPhotoSwipeItems([
    { ...photos[0], caption: 'Manifest caption' },
  ], ['a'])[0].caption).toBe('Manifest caption')
})
```

- [ ] **Step 2: 运行测试确认 RED**

Run: `npm test -- docs/.vuepress/themes/__tests__/storyPhotoSwipe.test.ts`

Expected: FAIL，因为 helper 尚不存在。

- [ ] **Step 3: 写最小实现**

用 `Map` 建立 photo lookup，按 `ids` 逐项过滤并调用 `thumbSrc(photo)` / `largeSrc(photo)`；caption 解析顺序为 `captions?.[id] ?? photo.caption ?? undefined`。不要在 helper 中排序或补齐缺失照片。

- [ ] **Step 4: 运行测试确认 GREEN**

Run: `npm test -- docs/.vuepress/themes/__tests__/storyPhotoSwipe.test.ts`

Expected: PASS。

- [ ] **Step 5: Commit helper**

```bash
git add docs/.vuepress/themes/gallery/storyPhotoSwipe.ts docs/.vuepress/themes/__tests__/storyPhotoSwipe.test.ts
git commit -m "feat(gallery): build story lightbox items"
```

### Task 4: 新增 `StoryAlbum` 并接入客户端组件

**Files:**
- Create: `docs/.vuepress/themes/components/gallery/StoryAlbum.vue`
- Modify: `docs/.vuepress/client.ts`
- Create: `docs/.vuepress/themes/__tests__/StoryAlbum.test.ts`
- Modify: `docs/.vuepress/themes/__tests__/PhotoStoryLayoutComponents.test.ts`

**Interfaces:**

```ts
interface StoryAlbumProps {
  ids: string[]
  captions?: Record<string, string | undefined>
}
```

`StoryAlbum` 输出 `.story-album`、`.story-album__item`、`.story-album__frame`、`.story-album__image`、可选 `.story-album__caption` 和 `.story-album__back`。

- [ ] **Step 1: 写失败测试**

在 `StoryAlbum.test.ts` mock `useGalleryData()` 返回 3 张照片，mock `vue-router` 的 `RouterLink`，并断言：

```ts
it('renders photos in ids order with 4:3 frames and optional captions', () => {
  const wrapper = mount(StoryAlbum, {
    props: { ids: ['b', 'a', 'missing'], captions: { b: 'Stacked sky' } },
  })

  expect(wrapper.findAll('.story-album__item')).toHaveLength(2)
  expect(wrapper.findAll('.story-album__image').map((img) => img.attributes('src')))
    .toEqual(['/gallery-img/b-thumb.webp', '/gallery-img/a-thumb.webp'])
  expect(wrapper.find('.story-album__caption').text()).toBe('Stacked sky')
  expect(wrapper.find('.story-album__back').attributes('href')).toBe('/gallery/')
})
```

Add a click test with a mocked `photoswipe` default class and assert the constructor receives `dataSource` with both ordered items and `index: 0` for the first clicked item.

- [ ] **Step 2: 运行测试确认 RED**

Run: `npm test -- docs/.vuepress/themes/__tests__/StoryAlbum.test.ts`

Expected: FAIL，因为 `StoryAlbum.vue` 和 global registration 尚不存在。

- [ ] **Step 3: 写最小实现**

`StoryAlbum.vue`：

- 用 computed lookup 将 `ids` 映射到真实 photos，跳过 missing ID。
- 4:3 frame 内使用 `thumbSrc(photo)`，设置 `loading="lazy"`、`decoding="async"`、`width`、`height`、`alt`。
- 使用 anchor，`href` 指向 large source；只对左键无 modifier 的点击 `preventDefault()` 并启动 lightbox，保留 modified-click 原生行为。
- 点击项时调用 `createStoryPhotoSwipeItems(photos.value, props.ids, props.captions)`，以 clicked photo 在有效 item 列表中的 index 初始化 `PhotoSwipe`。
- PhotoSwipe options 合并 `galleryPhotoSwipeOptions`，并设置 `preloaderDelay: 0`、`showHideAnimationType: 'zoom'`、`closeOnVerticalDrag: true`、`wheelToZoom: false`。
- 相册结束渲染 `<RouterLink class="story-album__back" to="/gallery/">返回瞳画</RouterLink>`。

在 `client.ts` import 并注册 `StoryAlbum`。

- [ ] **Step 4: 运行测试确认 GREEN**

Run: `npm test -- docs/.vuepress/themes/__tests__/StoryAlbum.test.ts docs/.vuepress/themes/__tests__/PhotoStoryLayoutComponents.test.ts`

Expected: PASS。

- [ ] **Step 5: Commit component**

```bash
git add docs/.vuepress/client.ts docs/.vuepress/themes/components/gallery/StoryAlbum.vue docs/.vuepress/themes/__tests__/StoryAlbum.test.ts docs/.vuepress/themes/__tests__/PhotoStoryLayoutComponents.test.ts
git commit -m "feat(gallery): add story album component"
```

### Task 5: 实现相册网格、页面宽度与白底 lightbox 样式

**Files:**
- Modify: `docs/.vuepress/themes/gallery/photoSwipeOptions.ts`
- Modify: `docs/.vuepress/themes/styles/_gallery.scss`
- Modify: `docs/.vuepress/themes/__tests__/photoSwipeOptions.test.ts`

**Interfaces:**
- `galleryPhotoSwipeOptions.arrowKeys` 为 `true`。
- `galleryPhotoSwipeOptions.loop` 保持 `false`。
- PhotoSwipe counter、close、prev、next controls 可见；zoom control 保持隐藏。

- [ ] **Step 1: 写失败测试**

在 `photoSwipeOptions.test.ts` 将导航断言改为：

```ts
expect(galleryPhotoSwipeOptions.arrowKeys).toBe(true)
expect(galleryPhotoSwipeOptions.loop).toBe(false)
```

并新增样式契约注释/类名测试不依赖浏览器布局；视觉细节通过后续 dev server 检查。

- [ ] **Step 2: 运行测试确认 RED**

Run: `npm test -- docs/.vuepress/themes/__tests__/photoSwipeOptions.test.ts`

Expected: FAIL，因为当前 `arrowKeys` 为 `false`。

- [ ] **Step 3: 写最小实现**

在 options 中将 `arrowKeys` 改为 `true`，保持 `loop: false`、`bgOpacity: 1`、48px 上下 padding。

在 `_gallery.scss`：

- 将 `.photo-story-page` 的媒体宽度从 720px 扩大到 `min(1080px, calc(100vw - 48px))`，正文保持 640px。
- 新增 `.story-album` grid：桌面 4 列、平板 3 列、手机 2 列，gap 使用现有暖白站点的 16/12px 节奏。
- `.story-album__frame` 使用 `aspect-ratio: 4 / 3`、白色/暖白容器和 `display: grid; place-items: center; overflow: hidden`。
- `.story-album__image` 使用 `width: 100%; height: 100%; object-fit: contain`，不裁切。
- caption 使用低对比度小字号并位于 frame 下方；hover 只改变 opacity，支持 `prefers-reduced-motion`。
- story 返回链接使用低调文字链接，不增加按钮式实体装饰。
- PhotoSwipe 使用白色背景、图片 1px `#e5e5e5` 边界；保留 48px 左右/上下 breathing room。
- 显示 `.pswp__counter`、`.pswp__button--close`、`.pswp__button--arrow`，隐藏 zoom；控制按钮使用白色背景和现有文本色。
- 清理旧样式中与新相册冲突的 `.pswp__counter`、close、arrow 全隐藏规则，但不破坏旧组件的单图关闭行为。

- [ ] **Step 4: 运行测试确认 GREEN**

Run: `npm test -- docs/.vuepress/themes/__tests__/photoSwipeOptions.test.ts`

Expected: PASS。

- [ ] **Step 5: Commit visual system**

```bash
git add docs/.vuepress/themes/gallery/photoSwipeOptions.ts docs/.vuepress/themes/styles/_gallery.scss docs/.vuepress/themes/__tests__/photoSwipeOptions.test.ts
git commit -m "style(gallery): shape album grid and lightbox"
```

### Task 6: 迁移 story 内容、关闭 story 评论并更新组件文档

**Files:**
- Modify: `docs/.vuepress/galleryStories.ts`
- Modify: `docs/.vuepress/themes/__tests__/galleryStories.test.ts`
- Modify: `docs/gallery/2026-05-06.md`
- Modify: `docs/.vuepress/themes/components/gallery/README.md`

**Interfaces:**
- `galleryStoryPagesPlugin` 对 story page 设置 `{ aside: false, outline: false, comments: false }`。
- 现有 story 使用一个 `StoryAlbum`，照片顺序为 `010b54cc976e`、`b597375e04e3`、`b0735e09eeeb`、`9f59a0e0c481`、`98a9c0597e73`、`afb0b234ec65`、`21a2f94b9ca5`。

- [ ] **Step 1: 写失败测试**

在 `galleryStories.test.ts` 将断言改为：

```ts
expect(story.frontmatter).toMatchObject({
  aside: false,
  outline: false,
  comments: false,
})
```

同时删除 gallery photos virtual module fixture 中的 `placeholder`、`bg` 字段，并断言加载结果不包含它们。

- [ ] **Step 2: 运行测试确认 RED**

Run: `npm test -- docs/.vuepress/themes/__tests__/galleryStories.test.ts`

Expected: FAIL，因为 plugin 当前没有设置 `comments: false`。

- [ ] **Step 3: 写最小实现与内容迁移**

在 `galleryStories.ts` 的 `extendsPage()` 中添加：

```ts
page.frontmatter.comments ??= false
```

将 `docs/gallery/2026-05-06.md` 的长叙事压缩为 2–3 句简介，删除 tip 和图片间段落，使用：

```md
<PhotoStoryHeader />

五一节尾声，赴颐和园等待一场预报中的晚霞。云层、昆明湖和日落后的绯红，构成这次拍摄的全部记忆。

<StoryAlbum
  :ids="['010b54cc976e', 'b597375e04e3', 'b0735e09eeeb', '9f59a0e0c481', '98a9c0597e73', 'afb0b234ec65', '21a2f94b9ca5']"
  :captions="{
    '9f59a0e0c481': '单张',
    '98a9c0597e73': '70 张堆栈',
    'afb0b234ec65': '200 张水面地景堆栈 + 天空单张',
  }"
/>
```

在组件 README 增加 `StoryAlbum` API、caption 映射和新完整 story 示例，并明确旧组件保留给特殊布局。

- [ ] **Step 4: 运行测试确认 GREEN**

Run: `npm test -- docs/.vuepress/themes/__tests__/galleryStories.test.ts`

Expected: PASS。

- [ ] **Step 5: Commit content and comments**

```bash
git add docs/.vuepress/galleryStories.ts docs/.vuepress/themes/__tests__/galleryStories.test.ts docs/gallery/2026-05-06.md docs/.vuepress/themes/components/gallery/README.md
git commit -m "feat(gallery): migrate story to album and hide comments"
```

### Task 7: 全量测试、生产构建和真实页面检查

**Files:**
- Modify only if verification exposes a regression in files from Tasks 1–6.

**Interfaces:**
- 不增加新接口；本任务验证设计文档中的验收标准。

- [ ] **Step 1: 运行完整自动化测试**

Run: `npm test`

Expected: 所有 Vitest test files PASS，且无新增 console error。

- [ ] **Step 2: 运行 gallery 测试和 VuePress build**

Run: `npm run gallery:test`

Expected: gallery pipeline tests PASS。

Run: `npm run docs:build`

Expected: VuePress production build succeeds；构建只生成 worktree 内被忽略的 `docs/.vuepress/dist/`，不提交产物。

- [ ] **Step 3: 启动本地站点检查真实页面**

Run: `npm run docs:dev -- --host 127.0.0.1`

检查 `/gallery/`、`/gallery/2026-05-06/`：

- 首页按年份显示 story 卡片，卡片信息为标题、地点、日期。
- story 标题和简介窄于相册；相册桌面端为 4 列 4:3，手机端为 2 列。
- 竖图、方图、全景图完整显示且不裁切。
- 网格请求 thumb；点击后立即打开白底 lightbox，并在 large 到达后替换。
- lightbox 显示白边、细边界、序号、关闭和前后导航；首尾不循环。
- story 页底部没有 Giscus，博客页仍有 Giscus。
- 键盘焦点可见，`prefers-reduced-motion` 下无强制动画。

- [ ] **Step 4: 检查 diff 和工作区**

Run: `git diff --check`

Expected: 无 whitespace error。

Run: `git status --short`

Expected: 只有本次实现源文件和测试文件；忽略的生成目录不进入 status。

- [ ] **Step 5: Commit verification fixes if needed**

如果 Step 1–4 发现实现缺陷，先为缺陷补充失败测试，再按 TDD 修正并提交；所有验证通过后不要提交生成产物。

## Spec Coverage Self-Review

- 首页 A「极简档案」：Task 5 保留现有首页布局、Task 7 验证卡片信息。
- Story 标题/简介/相册/返回：Task 4、Task 5、Task 6。
- 4:3、4/3/2 列、完整不裁切：Task 5。
- caption 映射：Task 3、Task 4、Task 6。
- story-level lightbox、thumb → large、不循环、序号和键盘：Task 3、Task 4、Task 5、Task 7。
- 所有 story thumb 与 placeholder 移除：Task 1、Task 2。
- 旧组件兼容：Task 2、Task 4、Task 6。
- story 评论关闭且其他页面不受影响：Task 6、Task 7。
- 自动化测试、生产构建和视觉检查：Task 7。

## Plan Self-Review

- 已使用确定的文件路径、函数名、组件 props 和测试命令，没有待办占位步骤。
- Task 3 定义的 `createStoryPhotoSwipeItems()` 被 Task 4 以同名接口消费。
- Task 1 的资源格式先于 Task 2 的前端 source 消费，Task 3–6 依次建立数据源、组件、样式和内容迁移依赖。
- build 产物和 R2 上传不在提交范围，真实资源生成由 `npm run gallery:build` 在发布流程执行。
