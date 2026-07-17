# Story 展墙错位节奏优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** 将 Story 页面实现为参考图风格的当代摄影展墙：保留照片顺序和原始画幅，用受控轻微错位、深石墨金属框、博物馆白卡纸和双层悬浮阴影建立展览感。

**Architecture:** 保持 StoryAlbum.vue 负责照片顺序、无障碍关系、原始比例变量和灯箱索引；用两个 CSS 自定义属性把桌面/平板错位值从组件传入展示层。所有错位和材质规则只作用于 .photo-story-page 与 .story-album，移动端在 CSS 断点中恢复两列并取消错位。标题和简介使用独立的 560–620px 阅读宽度，相册保持宽展墙版心。

**Tech Stack:** Vue 3 script setup、TypeScript、VuePress 2、SCSS、Vitest、PhotoSwipe、http-server 静态预览。

## Global Constraints

- 只修改 Story 页面；Gallery 首页、博客、笔记、照片 manifest、图库构建和 CDN 逻辑保持不变。
- 桌面 min-width: 960px 使用 4 列，第一行偏移固定为 0px / +14px / -6px / +18px，第二行第 5–7 张固定为 +10px / -4px / +8px。
- 平板 720–959px 使用 3 列，三列偏移固定为 0px / +8px / -4px。
- 移动端小于 720px 使用 2 列并完全取消错位。
- 相框使用约 2px 深石墨金属细框、18–22px 博物馆白卡纸、照片原始比例和 object-fit: cover。
- 灯箱继续隐藏右上角关闭按钮、保留边缘箭头、序号位于左上角并保持不循环。
- 不新增图片纹理资源；墙面纹理只使用低对比度 CSS 背景。
- 每个实现任务都要先写/更新失败测试，再运行最小测试确认失败，完成实现后再次运行确认通过。

## 文件地图

- docs/.vuepress/themes/components/gallery/StoryAlbum.vue：生成确定的桌面/平板错位 token；不改变照片顺序、aria/caption 关系和灯箱索引。
- docs/.vuepress/themes/styles/_gallery.scss：标题/简介阅读宽度、展墙间距、响应式错位、相框材质和展签。
- docs/.vuepress/themes/__tests__/StoryAlbum.test.ts：顺序、比例、错位 token、材质、caption、返回入口。
- docs/.vuepress/themes/__tests__/PhotoStoryHeader.test.ts：标题/简介阅读宽度和背景。
- docs/superpowers/specs/2026-07-17-gallery-story-exhibition-wall-design.md：已确认的视觉规格，作为实现验收基准。

---

### Task 1: 先锁定展墙节奏和阅读宽度的失败测试

**Files:**

- Modify: docs/.vuepress/themes/__tests__/StoryAlbum.test.ts:97-166
- Modify: docs/.vuepress/themes/__tests__/PhotoStoryHeader.test.ts:34-62

**Interfaces:**

- Consumes: 现有 StoryAlbum 渲染出的 .story-album__item inline style，以及样式文件读取断言。
- Produces: 后续组件和 SCSS 实现必须满足的桌面/平板 offset token、桌面间距、移动端归零、相框材质和标题阅读宽度契约。

- [ ] **Step 1: 为 StoryAlbum 增加错位 token 断言**

在现有第一组 StoryAlbum 渲染断言之后加入以下断言，确认第一张、第二张和第三张分别输出预期的桌面/平板 token：

~~~ts
const albumItems = wrapper.findAll('.story-album__item')

expect(albumItems[0].attributes('style')).toContain('--story-desktop-offset: 0px')
expect(albumItems[1].attributes('style')).toContain('--story-desktop-offset: 14px')
expect(albumItems[1].attributes('style')).toContain('--story-tablet-offset: 8px')
expect(albumItems[2].attributes('style')).toContain('--story-desktop-offset: -6px')
expect(albumItems[2].attributes('style')).toContain('--story-tablet-offset: -4px')
~~~

- [ ] **Step 2: 更新材质断言并补充响应式节奏断言**

将现有材质断言调整为下列目标，并在同一测试中加入响应式规则断言：

~~~ts
expect(frameRule).toMatch(/aspect-ratio:\s*var\(--story-photo-ratio, 4 \/ 3\)/)
expect(frameRule).toMatch(/border:\s*2px solid transparent/)
expect(frameRule).toMatch(/--story-mat-inset:\s*clamp\(18px,\s*1\.5vw,\s*22px\)/)
expect(frameRule).toMatch(/padding:\s*var\(--story-mat-inset\)/)
expect(frameRule).toMatch(/0 10px 18px rgba\(38, 36, 31, \.18\)/)
expect(frameRule).toMatch(/border-radius:\s*0/)
expect(frameRule).toMatch(/object-fit:\s*cover/)

const desktopAlbumRule =
  styles.match(/@media\s*\(min-width:\s*960px\)[\s\S]*?\.story-album\s*\{([^}]*)\}/)?.[1] ?? ''
const desktopItemRule =
  styles.match(/@media\s*\(min-width:\s*960px\)[\s\S]*?\.story-album__item\s*\{([^}]*)\}/)?.[1] ?? ''
const mobileItemRule =
  styles.match(/@media\s*\(max-width:\s*719px\)[\s\S]*?\.story-album__item\s*\{([^}]*)\}/)?.[1] ?? ''

expect(desktopAlbumRule).toMatch(/gap:\s*44px 28px/)
expect(desktopItemRule).toMatch(/--story-album-offset:\s*var\(--story-desktop-offset,\s*0px\)/)
expect(mobileItemRule).toMatch(/transform:\s*none/)
~~~

保留现有对 mat lip、图片边框、caption 横线 48px、caption 字号 12px 和 hover 亮度变化的断言；不要添加序号或卡片样式断言。

- [ ] **Step 3: 将 PhotoStoryHeader 的宽度断言改为窄阅读列**

把现有 header 与正文段落的 var(--story-media-width) 断言改为：

~~~ts
expect(headerRule).toMatch(/max-width:\s*min\(620px,\s*100%\)/)
expect(paragraphRule).toMatch(/max-width:\s*min\(620px,\s*100%\)/)
~~~

同时保留暖象牙白背景和左对齐断言。

- [ ] **Step 4: 运行最小测试确认新契约先失败**

Run:

~~~bash
npm test -- docs/.vuepress/themes/__tests__/StoryAlbum.test.ts docs/.vuepress/themes/__tests__/PhotoStoryHeader.test.ts
~~~

Expected: FAIL，失败点集中在尚未生成的 offset token、2px frame border、18–22px mat inset、桌面展墙 gap 或 620px header/paragraph max-width；现有顺序、caption、返回入口和图片比例断言仍应通过。

- [ ] **Step 5: 提交失败测试**

~~~bash
git add docs/.vuepress/themes/__tests__/StoryAlbum.test.ts docs/.vuepress/themes/__tests__/PhotoStoryHeader.test.ts
git commit -m "test(gallery): specify exhibition wall rhythm"
~~~

Expected: 创建一个只包含测试契约的提交。

### Task 2: 在 StoryAlbum 中生成稳定的桌面/平板错位 token

**Files:**

- Modify: docs/.vuepress/themes/components/gallery/StoryAlbum.vue:15-24, 61-70
- Test: docs/.vuepress/themes/__tests__/StoryAlbum.test.ts

**Interfaces:**

- Consumes: albumPhotos 的稳定顺序和现有 index。
- Produces: 每个 .story-album__item 都有 --story-desktop-offset 和 --story-tablet-offset 两个 CSS 自定义属性；照片 id、ratio style、caption id、aria-describedby 和 openPhotoSwipe(index) 保持不变。

- [ ] **Step 1: 写入确定性的 offset 表和纯函数**

在 StoryAlbum.vue 的 captionOf 附近加入：

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

桌面数组前四项对应第一行，后三项对应第二行；超过七张的项目回落为 0px，避免把第二行规则错误重复到后续照片。

- [ ] **Step 2: 让相框项目输出 token，同时保持原有比例**

把 figure 的单一 v-for 样式改为：

~~~vue
<figure
  v-for="({ id, photo }, index) in albumPhotos"
  :key="id + '-' + index"
  class="story-album__item"
  :style="{
    '--story-desktop-offset': String(desktopOffsetFor(index)) + 'px',
    '--story-tablet-offset': String(tabletOffsetFor(index)) + 'px',
  }"
>
~~~

保持 link 上现有的 --story-photo-ratio style、aria-describedby、href 和 click handler 原样存在；不要把 offset 计算放进相片数据或改变灯箱数组。

- [ ] **Step 3: 运行 StoryAlbum 测试确认组件契约通过**

Run:

~~~bash
npm test -- docs/.vuepress/themes/__tests__/StoryAlbum.test.ts
~~~

Expected: PASS，原有顺序、thumb.webp、原始比例、caption、返回图标和新增 offset token 断言全部通过。

- [ ] **Step 4: 提交组件改动**

~~~bash
git add docs/.vuepress/themes/components/gallery/StoryAlbum.vue docs/.vuepress/themes/__tests__/StoryAlbum.test.ts
git commit -m "feat(gallery): add controlled story frame offsets"
~~~

Expected: 创建一个只包含 offset token 生成逻辑及其测试的提交。

### Task 3: 用 SCSS 实现展墙错位、卡纸和悬浮材质

**Files:**

- Modify: docs/.vuepress/themes/styles/_gallery.scss:192-347, 535-649
- Test: docs/.vuepress/themes/__tests__/StoryAlbum.test.ts and docs/.vuepress/themes/__tests__/PhotoStoryHeader.test.ts

**Interfaces:**

- Consumes: Task 2 输出的 --story-desktop-offset / --story-tablet-offset token。
- Produces: 在 Story 页面作用域内可响应式呈现四列/三列/两列展墙，具备深石墨金属边框、博物馆白卡纸、照片内边界和右下方双层悬浮阴影；标题与简介宽度为 min(620px, 100%)。

- [ ] **Step 1: 收窄标题、日期地点和简介的阅读列**

在 .photo-story-header 中使用：

~~~scss
.photo-story-header {
  max-width: min(620px, 100%);
  margin: 12px 0 28px;
  text-align: left;
}
~~~

把 .photo-story-page .vp-doc > p 的 max-width 改为：

~~~scss
.photo-story-page .vp-doc > p {
  max-width: min(620px, 100%);
  margin: 0 0 28px;
  color: var(--story-muted-color);
  line-height: 1.75;
}
~~~

保留现有标题字号层级、暖象牙白背景和日期/地点分隔符。

- [ ] **Step 2: 设置桌面基础展墙与首行/次行错位**

将基础相册规则调整为：

~~~scss
.story-album {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: start;
  gap: 44px 28px;
  width: 100%;
  max-width: var(--story-media-width);
  margin: 0 0 48px;
}

.story-album__item {
  display: grid;
  min-width: 0;
  gap: 10px;
  transform: translateY(var(--story-album-offset, 0px));
}

@media (min-width: 960px) {
  .story-album__item {
    --story-album-offset: var(--story-desktop-offset, 0px);
  }
}
~~~

用 --story-desktop-offset 绑定后，第一行呈现 0 / +14 / -6 / +18px，第二行前 3 张呈现 +10 / -4 / +8px；后续照片保持 0px，避免持续漂移。

- [ ] **Step 3: 设置平板三列与移动端两列**

在现有响应式规则中写入：

~~~scss
@media (min-width: 720px) and (max-width: 959px) {
  .story-album {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 42px 28px;
  }

  .story-album__item {
    --story-album-offset: var(--story-tablet-offset, 0px);
  }
}

@media (max-width: 719px) {
  .story-album {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 32px 16px;
  }

  .story-album__item {
    --story-album-offset: 0px;
    transform: none;
  }
}
~~~

移动端相框的 --story-mat-inset 和 padding 同步降为 10px，保留两列的原始比例与图片可读性。

- [ ] **Step 4: 加强相框的金属边界、卡纸层和右下悬浮阴影**

将 .story-album__frame 及其伪元素收敛到以下材质规则：

~~~scss
.story-album__frame {
  --story-mat-inset: clamp(18px, 1.5vw, 22px);
  box-sizing: border-box;
  display: grid;
  aspect-ratio: var(--story-photo-ratio, 4 / 3);
  position: relative;
  place-items: center;
  overflow: hidden;
  border: 2px solid transparent;
  border-radius: 0;
  padding: var(--story-mat-inset);
  background:
    linear-gradient(var(--story-mat-color), var(--story-mat-color)) padding-box,
    linear-gradient(140deg, var(--story-frame-color) 0%, var(--story-frame-highlight) 48%, var(--story-frame-color) 100%) border-box;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.78),
    inset 0 -1px 0 rgba(44, 43, 39, 0.14),
    0 10px 18px rgba(38, 36, 31, 0.18),
    0 2px 4px rgba(38, 36, 31, 0.12);
}

.story-album__frame::before {
  content: '';
  position: absolute;
  inset: var(--story-mat-inset);
  border: 1px solid rgba(51, 50, 46, 0.18);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
  pointer-events: none;
}

.story-album__image {
  display: block;
  width: 100%;
  height: 100%;
  border: 1px solid rgba(45, 45, 42, 0.13);
  border-radius: 0;
  object-fit: cover;
}
~~~

保留现有 .story-album__caption 的纯文本展签、48px 细横线、小号灰黑色字体和无卡片/无圆角/无阴影规则；保留 hover 仅提升图片亮度，不新增放大、位移或实体卡片效果。

- [ ] **Step 5: 运行样式与组件测试确认通过**

Run:

~~~bash
npm test -- docs/.vuepress/themes/__tests__/StoryAlbum.test.ts docs/.vuepress/themes/__tests__/PhotoStoryHeader.test.ts
~~~

Expected: PASS，组件输出、标题阅读列、三档列数、错位 token、金属框、卡纸层、图片边界、阴影和纯文字展签断言全部通过。

- [ ] **Step 6: 提交展墙样式**

~~~bash
git add docs/.vuepress/themes/styles/_gallery.scss docs/.vuepress/themes/__tests__/StoryAlbum.test.ts docs/.vuepress/themes/__tests__/PhotoStoryHeader.test.ts
git commit -m "style(gallery): add controlled exhibition wall rhythm"
~~~

Expected: 创建一个只包含 Story 展墙样式和对应测试更新的提交。

### Task 4: 运行完整验证并用静态预览检查关键视口

**Files:**

- Verify: docs/.vuepress/themes/components/gallery/StoryAlbum.vue
- Verify: docs/.vuepress/themes/styles/_gallery.scss
- Verify: docs/.vuepress/themes/__tests__/StoryAlbum.test.ts
- Verify: docs/.vuepress/themes/__tests__/PhotoStoryHeader.test.ts
- Verify: docs/superpowers/specs/2026-07-17-gallery-story-exhibition-wall-design.md

**Interfaces:**

- Consumes: Task 3 的完整实现。
- Produces: 通过测试、构建、静态预览和视觉验收的 Story 展墙；不改变 Gallery 首页和其他页面。

- [ ] **Step 1: 运行图库与站点测试**

Run:

~~~bash
npm test
npm run gallery:test
~~~

Expected: 两条命令都以 PASS/成功退出，不出现 StoryAlbum、PhotoStoryHeader、PhotoSwipe 或现有图库测试回归。

- [ ] **Step 2: 运行生产构建和 diff 检查**

Run:

~~~bash
npm run docs:build
git diff --check
~~~

Expected: VuePress 构建成功，git diff --check 无输出且退出码为 0；生成的 dist 或图库资源不作为本次源代码提交内容。

- [ ] **Step 3: 启动静态预览**

Run:

~~~bash
npm run docs:preview -- -p 8080
~~~

Expected: 静态预览监听 http://127.0.0.1:8080，Story 路由可直接访问。使用静态预览检查生产构建后的 CSS 和资源路径，不依赖开发服务器的热更新状态。

- [ ] **Step 4: 检查桌面、平板和移动端视觉验收**

在浏览器分别打开 /gallery/2026-05-06/，检查以下结果：

~~~text
1440px：4 列；首行垂直偏移为 0px / +14px / -6px / +18px；第二行前三张为 +10px / -4px / +8px；相框之间无重叠。
820px：3 列；三列垂直偏移为 0px / +8px / -4px。
390px：2 列；所有 item transform 为 none；卡纸 inset 为 10px；照片和展签仍然清楚可读。
所有视口：暖象牙白墙面；深石墨细框、白卡纸、照片内边界和右下软阴影可分层辨认；标题/简介不超过 620px；展签只有横线和文字；返回入口仍为图标。
灯箱：右上关闭按钮隐藏；左右箭头靠近视口边缘且不遮挡照片；序号在左上角；到首尾后不循环。
~~~

- [ ] **Step 5: 只在验收发现间距问题时补充最小修正**

如果视觉验收仅发现间距或阴影需要微调，只修改 _gallery.scss 中对应 token，并在 StoryAlbum.test.ts 增加一个针对该 token 的断言，然后运行：

~~~bash
npm test -- docs/.vuepress/themes/__tests__/StoryAlbum.test.ts docs/.vuepress/themes/__tests__/PhotoStoryHeader.test.ts
npm run docs:build
git diff --check
~~~

Expected: focused tests、生产构建和 diff 检查均成功；提交信息使用 fix(gallery): tune exhibition wall spacing。

- [ ] **Step 6: 确认最终工作区范围**

~~~bash
git status --short
git log --oneline -5
~~~

Expected: 仅包含本计划涉及的源文件和测试变更；没有手动编辑构建产物、图库派生图或无关配置。
