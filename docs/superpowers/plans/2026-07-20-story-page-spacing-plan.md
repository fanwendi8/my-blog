# 故事页宽屏留白与卡纸比例优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 增大故事页在宽屏下的内容利用率，并在所有断点缩小卡纸内衬，让照片展示面积略微增加。

**Architecture:** 仅调整 `photo-story-page` 和 `story-album` 的现有 CSS 变量与断点覆盖，不改变 Vue 组件、图库数据、图片比例或 PhotoSwipe 行为。宽屏容器从固定的 1280px 上限放宽到 1760px，并按桌面、平板、移动端分别收窄卡纸内衬。

**Tech Stack:** VuePress 2, VuePress Plume, SCSS, Vitest, VuePress production build

## Global Constraints

- 保持现有 ESM、TypeScript 和 SCSS 风格。
- 不手动编辑图库生成资源。
- 不改变故事页内容、图片资源、图片比例、排序和灯箱行为。
- 视觉改动需要覆盖宽屏、平板和移动端，并尊重现有响应式断点。

---

### Task 1: 调整故事页宽度与卡纸内衬

**Files:**
- Modify: `/Users/fanwendi/work/vibe_coding/my-blog/docs/.vuepress/themes/styles/_gallery.scss:137-322, 603-620, 626-680`

**Interfaces:**
- Consumes: 现有 `.photo-story-page`、`.story-album`、`.story-album__frame` 变量和响应式断点。
- Produces: 仅 CSS 变量值变化；Vue 组件和图库数据接口保持不变。

- [ ] **Step 1: 修改宽屏媒体容器上限**

将 `.photo-story-page` 的媒体宽度从：

```scss
--story-media-width: min(1280px, calc(100vw - 64px));
```

调整为：

```scss
--story-media-width: min(1760px, calc(100vw - 96px));
```

同时将 `.story-album` 的宽度上限同步为：

```scss
max-width: min(1760px, calc(100vw - 96px));
```

- [ ] **Step 2: 收窄默认桌面卡纸内衬**

将 `.story-album__frame` 的默认内衬从：

```scss
--story-mat-inset: clamp(20px, 2vw, 24px);
```

调整为：

```scss
--story-mat-inset: clamp(14px, 1.35vw, 18px);
```

- [ ] **Step 3: 同步调整平板和移动端覆盖值**

移动端将两个 `150px` 断点中的内衬保持为可读的 `6px`；平板/中等桌面将：

```scss
--story-mat-inset: clamp(16px, 2vw, 20px);
```

调整为：

```scss
--story-mat-inset: clamp(10px, 1.25vw, 14px);
```

保留现有边框、阴影、图片 `object-fit` 和所有 gap 设置。

- [ ] **Step 4: 检查修改范围**

运行：

```bash
git diff -- docs/.vuepress/themes/styles/_gallery.scss
```

预期：只包含故事页宽度上限、`.story-album` 宽度上限和卡纸内衬相关值的变化。

- [ ] **Step 5: 运行回归测试与生产构建**

运行：

```bash
npm run gallery:test
npm test
npm run docs:build
```

预期：图库测试、完整测试和 VuePress 生产构建全部成功。

- [ ] **Step 6: 启动开发服务器检查页面**

运行：

```bash
npm run docs:dev
```

检查 `/gallery/2026-05-06/` 在宽屏、平板和移动端下：故事内容左右留白减少，卡纸内衬变薄，图片显示面积增大，返回按钮和灯箱点击仍可用。

- [ ] **Step 7: 提交实现**

```bash
git add docs/.vuepress/themes/styles/_gallery.scss
git commit -m "style(gallery): enlarge story photo area"
```
