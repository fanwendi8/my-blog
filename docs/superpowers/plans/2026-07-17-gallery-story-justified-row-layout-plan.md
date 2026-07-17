# Story 相册齐行画廊布局实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** 将 Story 相册从固定四列错位网格改造成固定目标行高、画幅自然宽度、每行居中的齐行画廊，并同步加宽相框卡纸与立体阴影。

**Architecture:** StoryAlbum.vue 继续只负责照片顺序、图片比例、图片资源、无障碍关系和 PhotoSwipe 索引；移除旧的桌面/平板 offset token，让 CSS Flex 换行负责按自然宽度分行。_gallery.scss 提供三档目标行高、相册版心、相框材料和展签规则，完全不读取 viewport，也不引入运行时行分组计算。

**Tech Stack:** Vue 3 script setup、TypeScript、VuePress 2、SCSS、Vitest、PhotoSwipe、http-server 静态预览。

## Global Constraints

- 只修改 Story 页面；Gallery 首页、博客、笔记、照片 manifest、图库构建和 CDN 逻辑保持不变。
- 相册使用 display: flex、flex-wrap: wrap、justify-content: center；照片顺序保持 Markdown ids 顺序。
- 桌面 ≥ 1200px：最大宽度 min(1400px, calc(100vw - 64px))，目标相框高度 220px，横向间距 24px，行间距 32px。
- 平板 720–1199px：最大宽度 min(1120px, calc(100vw - 48px))，目标相框高度 185px，横向间距 20px，行间距 28px。
- 移动端 < 720px：最大宽度 calc(100vw - 32px)，目标相框高度 140px，横向间距 12px，行间距 22px；宽画幅必要时独占一行。
- 相框使用约 3px 深石墨金属外框、桌面 24–28px 博物馆白卡纸、平板 20–24px 卡纸、移动端 10–12px 卡纸。
- 相框保持原始画幅比例；图片使用 object-fit: cover；不使用圆角、全出血、木纹或 hover 位移。
- 每行整体居中，最后一行不拉伸；删除旧的桌面/平板 offset token 和 translateY。
- 展签只保留约 48px 细横线和文字，不显示序号，不使用卡片底板、圆角或阴影。
- 标题和简介最大宽度保持 min(620px, 100%)；宽屏 Story 段落行高保持 1.75。
- PhotoSwipe 保持关闭按钮隐藏、边缘箭头、左上角序号和不循环。
- 不新增图片纹理、照片资源、manifest 对象或 CDN 上传逻辑。
- 每个实现任务都先更新失败测试，再运行最小测试确认失败，完成实现后再次运行确认通过。

## 文件地图

- Modify: docs/.vuepress/themes/__tests__/StoryAlbum.test.ts — 锁定 Flex 齐行、目标行高、相框材料和现有图片/灯箱契约。
- Modify: docs/.vuepress/themes/components/gallery/StoryAlbum.vue — 移除旧 offset token，保持照片比例和行为接口。
- Modify: docs/.vuepress/themes/styles/_gallery.scss — 实现 Flex 换行、三档行高、宽版心、加宽卡纸和立体阴影。
- Verify: docs/.vuepress/themes/__tests__/PhotoStoryHeader.test.ts — 确认 620px 阅读列和宽屏行高不回归。
- Verify: docs/superpowers/specs/2026-07-17-gallery-story-justified-row-layout-design.md — 实现逐条对照设计规格。

---

### Task 1: 先锁定齐行布局的失败测试

**Files:**

- Modify: docs/.vuepress/themes/__tests__/StoryAlbum.test.ts:97-181
- Test: docs/.vuepress/themes/__tests__/PhotoStoryHeader.test.ts

**Interfaces:**

- Consumes: 当前 StoryAlbum 的照片顺序、比例 style、caption、返回入口和样式字符串测试。
- Produces: 后续组件和 SCSS 必须满足的 Flex 布局、三档目标行高、居中、无 offset transform、加宽相框材料契约。

- [ ] **Step 1: 删除旧 offset token 的组件断言**

在 StoryAlbum 的顺序测试中，删除以下旧断言：

~~~ts
expect(albumItems[0].attributes('style') ?? '').toContain('--story-desktop-offset: 0px')
expect(albumItems[1].attributes('style') ?? '').toContain('--story-desktop-offset: 14px')
expect(albumItems[1].attributes('style') ?? '').toContain('--story-tablet-offset: 8px')
expect(albumItems[2].attributes('style') ?? '').toContain('--story-desktop-offset: -6px')
expect(albumItems[2].attributes('style') ?? '').toContain('--story-tablet-offset: -4px')
~~~

替换为：

~~~ts
expect(albumItems.every((item) => item.attributes('style') === undefined)).toBe(true)
~~~

保留照片顺序、thumb.webp、原始比例、caption 和返回入口断言。

- [ ] **Step 2: 更新移动端与相框样式契约**

将样式测试中的目标替换为：

~~~ts
const itemRule = styles.match(/\.story-album__item\s*\{([^}]*)\}/)?.[1] ?? ''

expect(albumRule).toMatch(/display:\s*flex/)
expect(albumRule).toMatch(/flex-wrap:\s*wrap/)
expect(albumRule).toMatch(/justify-content:\s*center/)
expect(albumRule).toMatch(/max-width:\s*min\(1400px,\s*calc\(100vw - 64px\)\)/)
expect(itemRule).toMatch(/flex:\s*0 0 auto/)
expect(itemRule).not.toMatch(/transform:/)
expect(frameRule).toMatch(/height:\s*var\(--story-row-height\)/)
expect(frameRule).toMatch(/width:\s*auto/)
expect(frameRule).toMatch(/border:\s*3px solid transparent/)
expect(frameRule).toMatch(/--story-mat-inset:\s*clamp\(24px,\s*2vw,\s*28px\)/)
expect(frameRule).toMatch(/0 12px 22px rgba\(38, 36, 31, \.18\)/)
expect(backRule).toMatch(/flex-basis:\s*100%/)
~~~

同时把移动端测试改为匹配：

~~~ts
expect(mobileAlbumRule).toMatch(/gap:\s*22px 12px/)
expect(mobileAlbumRule).toMatch(/max-width:\s*calc\(100vw - 32px\)/)
~~~

- [ ] **Step 3: 增加三档目标行高媒体规则断言**

在样式测试中加入：

~~~ts
const desktopAlbumRule =
  styles.match(/@media\s*\(min-width:\s*1200px\)[\s\S]*?\.story-album\s*\{([^}]*)\}/)?.[1] ?? ''
const tabletAlbumRule =
  styles.match(/@media\s*\(min-width:\s*720px\)\s*and\s*\(max-width:\s*1199px\)[\s\S]*?\.story-album\s*\{([^}]*)\}/)?.[1] ?? ''
const mobileFrameRule =
  styles.match(/@media\s*\(max-width:\s*719px\)[\s\S]*?\.story-album__frame\s*\{([^}]*)\}/)?.[1] ?? ''

expect(desktopAlbumRule).toMatch(/--story-row-height:\s*220px/)
expect(tabletAlbumRule).toMatch(/--story-row-height:\s*185px/)
expect(mobileFrameRule).toMatch(/--story-row-height:\s*140px/)
expect(mobileFrameRule).toMatch(/--story-mat-inset:\s*10px/)
~~~

- [ ] **Step 4: 运行最小测试确认新契约先失败**

Run:

~~~bash
npm test -- docs/.vuepress/themes/__tests__/StoryAlbum.test.ts docs/.vuepress/themes/__tests__/PhotoStoryHeader.test.ts
~~~

Expected: FAIL，失败点集中在旧 grid/offset 样式、旧 2px 边框、旧 18–22px 卡纸、缺少 Flex 规则和缺少三档目标行高；现有 PhotoSwipe、顺序、资源和无障碍测试仍应通过。

- [ ] **Step 5: 提交失败测试契约**

~~~bash
git add docs/.vuepress/themes/__tests__/StoryAlbum.test.ts
git commit -m "test(gallery): specify justified story rows"
~~~

Expected: 创建只包含齐行布局测试契约的提交。

### Task 2: 移除 StoryAlbum 的旧 offset 输出

**Files:**

- Modify: docs/.vuepress/themes/components/gallery/StoryAlbum.vue:27-38, 74-81
- Test: docs/.vuepress/themes/__tests__/StoryAlbum.test.ts

**Interfaces:**

- Consumes: Task 1 的无 offset token 测试。
- Produces: StoryAlbum 保留 albumPhotos、captionOf、captionId、accessibleLabel、openPhotoSwipe 和 ratio style；figure 不再输出桌面/平板 offset 自定义属性。

- [ ] **Step 1: 删除 offset 常量和计算函数**

从 captionOf 后删除：

~~~ts
const desktopOffsets = [0, 14, -6, 18, 10, -4, 8]
const tabletOffsets = [0, 8, -4]

function desktopOffsetFor(index: number) {
  return desktopOffsets[index] ?? 0
}

function tabletOffsetFor(index: number) {
  return tabletOffsets[index % tabletOffsets.length] ?? 0
}
~~~

不要修改 captionOf、captionId 或 PhotoSwipe 逻辑。

- [ ] **Step 2: 删除 figure 上的 offset style**

把 figure 保持为：

~~~vue
<figure
  v-for="({ id, photo }, index) in albumPhotos"
  :key="id + '-' + index"
  class="story-album__item"
>
~~~

保留 link 上的 --story-photo-ratio style、href、aria-describedby 和 click handler。

- [ ] **Step 3: 运行组件测试**

Run:

~~~bash
npm test -- docs/.vuepress/themes/__tests__/StoryAlbum.test.ts
~~~

Expected: PASS，顺序、thumb.webp、large.avif、比例、caption、返回入口、PhotoSwipe index 和无 offset style 测试全部通过；样式契约测试仍因 Task 3 尚未实现而失败时，记录为预期失败。

- [ ] **Step 4: 提交组件清理**

~~~bash
git add docs/.vuepress/themes/components/gallery/StoryAlbum.vue docs/.vuepress/themes/__tests__/StoryAlbum.test.ts
git commit -m "refactor(gallery): remove story album offsets"
~~~

Expected: 创建只包含组件 offset 清理的提交。

### Task 3: 实现 Flex 齐行、加宽相框和三档目标行高

**Files:**

- Modify: docs/.vuepress/themes/styles/_gallery.scss:263-377, 590-687
- Test: docs/.vuepress/themes/__tests__/StoryAlbum.test.ts

**Interfaces:**

- Consumes: Task 2 输出的 photos order、ratio style 和无 offset figure。
- Produces: StoryAlbum 在三档视口下按目标高度自然换行、每行居中、宽画幅自然变宽，并显示 3px 石墨框、宽卡纸和双层阴影。

- [ ] **Step 1: 替换基础相册为 Flex 齐行规则**

将基础相册与 item 规则调整为：

~~~scss
.story-album {
  --story-row-height: 220px;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: center;
  gap: 32px 24px;
  width: 100%;
  max-width: min(1400px, calc(100vw - 64px));
  margin: 0 auto 48px;
}

.story-album__item {
  display: grid;
  flex: 0 0 auto;
  min-width: 0;
  margin: 0;
  gap: 10px;
}
~~~

不要在 item 或任何 StoryAlbum 媒体规则中保留 translateY 或 offset 自定义属性。

- [ ] **Step 2: 让相框以固定目标高度和原始比例计算宽度**

将相框开头规则调整为：

~~~scss
.story-album__frame {
  --story-mat-inset: clamp(24px, 2vw, 28px);
  box-sizing: border-box;
  display: grid;
  width: auto;
  max-width: 100%;
  height: var(--story-row-height);
  aspect-ratio: var(--story-photo-ratio, 4 / 3);
  position: relative;
  place-items: center;
  overflow: hidden;
  border: 3px solid transparent;
  border-radius: 0;
  padding: var(--story-mat-inset);
  background:
    linear-gradient(var(--story-mat-color), var(--story-mat-color)) padding-box,
    linear-gradient(140deg, var(--story-frame-color) 0%, var(--story-frame-highlight) 48%, var(--story-frame-color) 100%) border-box;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, .82),
    inset 0 -1px 0 rgba(44, 43, 39, .16),
    0 2px 4px rgba(38, 36, 31, .14),
    0 12px 22px rgba(38, 36, 31, .18);
}
~~~

保留 frame lip 的 inset 卡纸边界、图片 1px 内边界、object-fit: cover、无圆角和 hover 仅 opacity 变化。

- [ ] **Step 3: 让返回入口跨行并居中**

在 .story-album__back 中加入：

~~~scss
.story-album__back {
  flex: 0 0 100%;
  width: fit-content;
  margin-right: auto;
  margin-left: auto;
}
~~~

保留现有 32px 可点击区域、aria-label、title、SVG 图标和 focus-visible。

- [ ] **Step 4: 写入平板和移动端目标值**

替换旧的 grid media 规则为：

~~~scss
@media (min-width: 720px) and (max-width: 1199px) {
  .story-album {
    --story-row-height: 185px;
    max-width: min(1120px, calc(100vw - 48px));
    gap: 28px 20px;
  }

  .story-album__frame {
    --story-mat-inset: clamp(20px, 2vw, 24px);
  }
}

@media (max-width: 719px) {
  .story-album {
    --story-row-height: 140px;
    max-width: calc(100vw - 32px);
    gap: 22px 12px;
  }

  .story-album__frame {
    --story-mat-inset: 10px;
    max-width: 100%;
  }
}
~~~

删除旧的 2/3/4 列 grid-template-columns、offset token 和 transform 规则；保留 Story 页面其他 split/photos 响应式布局不变。

- [ ] **Step 5: 运行 focused tests**

Run:

~~~bash
npm test -- docs/.vuepress/themes/__tests__/StoryAlbum.test.ts docs/.vuepress/themes/__tests__/PhotoStoryHeader.test.ts
~~~

Expected: PASS，Flex 布局、三档目标高度、3px 相框、24–28px 卡纸、宽版心、返回跨行和现有 Story/PhotoStoryHeader 测试全部通过。

- [ ] **Step 6: 提交齐行展墙样式**

~~~bash
git add docs/.vuepress/themes/styles/_gallery.scss docs/.vuepress/themes/__tests__/StoryAlbum.test.ts
git commit -m "style(gallery): adopt justified story rows"
~~~

Expected: 创建只包含齐行展墙样式和对应测试的提交。

### Task 4: 构建、静态预览和三档视口验收

**Files:**

- Verify: docs/.vuepress/themes/components/gallery/StoryAlbum.vue
- Verify: docs/.vuepress/themes/styles/_gallery.scss
- Verify: docs/.vuepress/themes/__tests__/StoryAlbum.test.ts
- Verify: docs/.vuepress/themes/__tests__/PhotoStoryHeader.test.ts
- Verify: docs/superpowers/specs/2026-07-17-gallery-story-justified-row-layout-design.md

**Interfaces:**

- Consumes: Task 3 的完整实现。
- Produces: 通过测试、构建、静态预览和视觉验收的 Story 齐行展墙。

- [ ] **Step 1: 运行完整测试**

~~~bash
npm test
npm run gallery:test
~~~

Expected: npm test 通过全部主题测试；gallery:test 通过全部图库测试。

- [ ] **Step 2: 运行生产构建和格式检查**

~~~bash
npm run docs:build
git diff --check
~~~

Expected: VuePress 生产构建成功，git diff --check 无输出；不提交 dist 或图库派生构建产物。

- [ ] **Step 3: 启动静态预览并检查 Story 路由**

~~~bash
npm run docs:preview -- -p 8080
curl -I http://127.0.0.1:8080/gallery/2026-05-06/
~~~

Expected: 预览监听 8080，Story 路由返回 HTTP 200。

- [ ] **Step 4: 检查三档视口**

在浏览器打开 /gallery/2026-05-06/：

~~~text
1440px：版心接近 1400px；相框高度约 220px；宽画幅自然变宽；所有行居中；最后一行不拉伸；无横向溢出。
820px：相框高度约 185px；每行居中；宽画幅不溢出；照片顺序保持。
390px：相框高度约 140px；必要时宽画幅独占一行；4:3/竖幅可读；卡纸约 10px；展签和返回图标不遮挡。
所有视口：3px 深石墨框、白卡纸、照片内边界和右下阴影可区分；标题/简介不超过 620px；展签只有横线和文字。
灯箱：关闭按钮隐藏、箭头靠边且不遮挡图片、序号在左上角、首尾不循环。
~~~

- [ ] **Step 5: 确认最终工作区**

~~~bash
git status --short
git log --oneline -5
~~~

Expected: 没有未提交的产品代码、测试或配置变更；工作区只保留本次实现相关提交。
