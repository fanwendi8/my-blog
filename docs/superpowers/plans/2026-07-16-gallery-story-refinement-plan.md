# Gallery Story Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将摄影 story 页面收紧为无站点导航的纯白画册，使用细边框白色内衬相框、底部 icon-only 返回入口和不遮挡照片的低调 lightbox 控件。

**Architecture:** 保留 `StoryAlbum` 的数据和 PhotoSwipe 初始化边界；页面壳层和标题继续由 `.photo-story-page` 与 `PhotoStoryHeader` 控制；所有新视觉只通过 story-scoped CSS 和 `storyAlbumPhotoSwipeOptions` 生效，不改变博客、笔记和 Gallery 首页。测试先锁定 DOM/API 合同，再实现样式和交互。

**Tech Stack:** Vue 3、VuePress 2、TypeScript、PhotoSwipe 5、SCSS、Vitest、Vue Test Utils。

## Global Constraints

- story 页面不保留任何站点级导航：隐藏品牌入口、顶部导航链接、移动端菜单按钮和导航栏占位；博客和笔记页面不做改动。
- 相框外框固定为 `1px solid #cfcfcf`，内部白色内衬固定为 `6px`，不使用阴影、圆角或厚边框。
- 相册继续为 4:3、`contain`、桌面 4 列、平板 3 列、移动端 2 列，网格间距固定为 `20px`。
- 标题 30px、移动端 25px；metadata 12px；简介最大宽度 600px、字号 15px、行高 1.65；标题区到相册 28px。
- 返回入口只显示细线左箭头，点击区域不小于 32px，必须有 `aria-label="返回瞳画"` 和 `title="返回瞳画"`。
- Story lightbox 隐藏 close button；保留背景点击、Esc、垂直拖动关闭、计数、箭头、键盘和移动端滑动。
- Story lightbox 箭头点击区域固定为 36px、视觉 chevron 20px、默认透明度 0.55、hover/focus 透明度 0.9，不能覆盖图片主体。
- 不修改照片 manifest、CDN URL、旧图片组件或 Gallery 首页。

---

### Task 1: Lock the story presentation contracts with tests

**Files:**
- Modify: `docs/.vuepress/themes/__tests__/StoryAlbum.test.ts`
- Modify: `docs/.vuepress/themes/__tests__/photoSwipeOptions.test.ts`
- Create: `docs/.vuepress/themes/__tests__/PhotoStoryHeader.test.ts`

**Interfaces:**
- Tests consume the existing `StoryAlbum` props `ids` and `captions`, `storyAlbumPhotoSwipeOptions`, and the new isolated `PhotoStoryHeader` fixture.
- Tests produce failing contracts for icon-only back navigation, story-only options, hidden close control, and story-scoped navigation CSS.

- [ ] **Step 1: Write failing assertions**

Add these behaviors before production changes:

```ts
it('renders an icon-only back link with an accessible name and tooltip', () => {
  const wrapper = mount(StoryAlbum, { props: { ids: ['b'] } })
  const back = wrapper.get('.story-album__back')

  expect(back.attributes('aria-label')).toBe('返回瞳画')
  expect(back.attributes('title')).toBe('返回瞳画')
  expect(back.text()).toBe('')
  expect(back.find('svg').exists()).toBe(true)
})
```

Extend the PhotoSwipe assertions so story options contain `close: false`, retain `arrowPrev`, `arrowNext`, `counter`, `loop: false`, and keep `mainClass: 'story-album-lightbox'`. Add a source-style assertion that `_gallery.scss` contains a `.photo-story-page` navbar/menu reset and that story arrow rules are scoped to `.pswp.story-album-lightbox`.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
npx vitest run docs/.vuepress/themes/__tests__/StoryAlbum.test.ts docs/.vuepress/themes/__tests__/photoSwipeOptions.test.ts
```

Expected: FAIL because the current back link still renders text and the current story options/styles do not satisfy the new contracts.

- [ ] **Step 3: Commit the red tests only**

```bash
git add docs/.vuepress/themes/__tests__/StoryAlbum.test.ts docs/.vuepress/themes/__tests__/photoSwipeOptions.test.ts docs/.vuepress/themes/__tests__/PhotoStoryHeader.test.ts
git commit -m "test(gallery): define refined story presentation"
```

---

### Task 2: Remove the story navigation shell and tighten story copy

**Files:**
- Modify: `docs/.vuepress/themes/components/gallery/StoryAlbum.vue`
- Modify: `docs/.vuepress/themes/components/gallery/PhotoStoryHeader.vue`
- Modify: `docs/.vuepress/themes/styles/_gallery.scss`
- Test: tests created or modified in Task 1

**Interfaces:**
- `StoryAlbum` continues to accept `ids: string[]` and optional `captions` without changing its data flow.
- `PhotoStoryHeader` continues to read page frontmatter and emits the same semantic `h1`, `time`, and location content.

- [ ] **Step 1: Implement the icon-only back link**

Replace the text-only `RouterLink` with an accessible icon link:

```vue
<RouterLink
  class="story-album__back"
  to="/gallery/"
  aria-label="返回瞳画"
  title="返回瞳画"
>
  <svg aria-hidden="true" viewBox="0 0 20 20" focusable="false">
    <path d="M11.5 4.5 6 10l5.5 5.5" />
  </svg>
</RouterLink>
```

Keep the link after the last album item and preserve keyboard focus semantics.

- [ ] **Step 2: Tighten header values**

Keep the existing frontmatter reads, but use the compact classes already owned by `PhotoStoryHeader`; do not move navigation logic into the component. The stylesheet must set desktop `h1` to `30px`, mobile `h1` to `25px`, metadata to `12px`, intro text to `15px/1.65`, intro max-width to `600px`, and the header-to-album gap to `28px`.

- [ ] **Step 3: Remove all site-level navigation only on story pages**

Add scoped selectors under `.photo-story-page` for the actual Plume navbar and its mobile menu trigger/container, and set them to `display: none` with the corresponding top spacing reset. Do not add a global `.vp-navbar` rule. Verify the header and album remain visible after the navbar is removed.

- [ ] **Step 4: Run focused tests and commit**

Run:

```bash
npx vitest run docs/.vuepress/themes/__tests__/StoryAlbum.test.ts docs/.vuepress/themes/__tests__/PhotoStoryLayoutComponents.test.ts docs/.vuepress/themes/__tests__/galleryStories.test.ts
```

Expected: all focused tests pass. Commit:

```bash
git add docs/.vuepress/themes/components/gallery/StoryAlbum.vue docs/.vuepress/themes/components/gallery/PhotoStoryHeader.vue docs/.vuepress/themes/styles/_gallery.scss docs/.vuepress/themes/__tests__
git commit -m "style(gallery): strip story navigation shell"
```

---

### Task 3: Give the album frames a quiet but visible boundary

**Files:**
- Modify: `docs/.vuepress/themes/styles/_gallery.scss`
- Modify: `docs/.vuepress/themes/__tests__/StoryAlbum.test.ts` only if a class/attribute contract is needed

**Interfaces:**
- `StoryAlbum` markup remains the existing `figure.story-album__item > a.story-album__frame > img.story-album__image` structure.
- The visual contract is CSS-only: `4:3`, `contain`, `1px #cfcfcf`, `6px` white inner mat, no shadow/radius, `20px` grid gap.

- [ ] **Step 1: Add the failing style contract**

Extend the existing style source assertion with these exact strings:

```ts
expect(styles).toContain('border: 1px solid #cfcfcf')
expect(styles).toContain('padding: 6px')
expect(styles).toContain('gap: 20px')
expect(styles).toContain('box-shadow: none')
```

- [ ] **Step 2: Run the style test and verify RED**

Run:

```bash
npx vitest run docs/.vuepress/themes/__tests__/photoSwipeOptions.test.ts
```

Expected: FAIL on the new frame token assertions.

- [ ] **Step 3: Implement the minimal frame CSS**

Set `.story-album` gap to `20px`; set `.story-album__frame` to `padding: 6px`, `border: 1px solid #cfcfcf`, `border-radius: 0`, `box-shadow: none`, and retain `aspect-ratio: 4 / 3` and `contain`. Keep hover behavior limited to image opacity, with no transform or zoom.

- [ ] **Step 4: Run tests and commit**

Run:

```bash
npx vitest run docs/.vuepress/themes/__tests__/StoryAlbum.test.ts docs/.vuepress/themes/__tests__/photoSwipeOptions.test.ts
```

Expected: PASS. Commit:

```bash
git add docs/.vuepress/themes/styles/_gallery.scss docs/.vuepress/themes/__tests__/photoSwipeOptions.test.ts
git commit -m "style(gallery): sharpen story album frames"
```

---

### Task 4: Quiet the story lightbox controls

**Files:**
- Modify: `docs/.vuepress/themes/gallery/storyAlbumPhotoSwipe.ts`
- Modify: `docs/.vuepress/themes/styles/_gallery.scss`
- Modify: `docs/.vuepress/themes/__tests__/StoryAlbum.test.ts`
- Modify: `docs/.vuepress/themes/__tests__/photoSwipeOptions.test.ts`

**Interfaces:**
- `storyAlbumPhotoSwipeOptions` remains a `PhotoSwipeOptions` object consumed only by `StoryAlbum`.
- `configureStoryAlbumPhotoSwipe(photoSwipe)` remains the runtime hook for story-only filters and UI registration.

- [ ] **Step 1: Write the failing lightbox control assertions**

Add expectations:

```ts
expect(storyAlbumPhotoSwipeOptions.close).toBe(false)
expect(storyAlbumPhotoSwipeOptions.arrowPrev).toBe(true)
expect(storyAlbumPhotoSwipeOptions.arrowNext).toBe(true)
expect(storyAlbumPhotoSwipeOptions.counter).toBe(true)
expect(storyAlbumPhotoSwipeOptions.loop).toBe(false)
```

In the style source test, assert the story arrow rule contains `width: 36px`, the icon contains `width: 20px`, the story arrow opacity contains `0.55`, and no `.pswp.story-album-lightbox .pswp__button--close` display rule is added. The existing global close behavior must remain untouched.

- [ ] **Step 2: Run focused tests and verify RED**

```bash
npx vitest run docs/.vuepress/themes/__tests__/StoryAlbum.test.ts docs/.vuepress/themes/__tests__/photoSwipeOptions.test.ts
```

Expected: FAIL on the new story control contracts.

- [ ] **Step 3: Implement story-only options and controls**

Add `close: false`, `arrowPrev: true`, `arrowNext: true`, and `counter: true` to `storyAlbumPhotoSwipeOptions`. Keep `galleryPhotoSwipeOptions` unchanged. Scope all control CSS to `.pswp.story-album-lightbox`; hide only the story close control through the story configuration, place arrows at the viewport edges with no background/border, and set a `36px` target with a `20px` chevron and `opacity: .55` / `:hover,:focus-visible { opacity: .9; }`. Preserve `counter`, caption, swipe, Esc, background close, and no-zoom behavior.

- [ ] **Step 4: Run tests and commit**

Run:

```bash
npx vitest run docs/.vuepress/themes/__tests__/StoryAlbum.test.ts docs/.vuepress/themes/__tests__/photoSwipeOptions.test.ts docs/.vuepress/themes/__tests__/photoSwipeClickToClose.test.ts
```

Expected: PASS. Commit:

```bash
git add docs/.vuepress/themes/gallery/storyAlbumPhotoSwipe.ts docs/.vuepress/themes/styles/_gallery.scss docs/.vuepress/themes/__tests__
git commit -m "style(gallery): quiet story lightbox controls"
```

---

### Task 5: Full verification and local visual review

**Files:**
- Modify only if validation exposes a concrete regression in the files owned by Tasks 2–4.
- Test: all existing tests and local dev pages.

**Interfaces:**
- `/gallery/` remains unchanged.
- `/gallery/2026-05-06/` has no site-level navigation, compact story header, bordered album frames, icon-only return link, and story lightbox without a visible close button.

- [ ] **Step 1: Run complete automated verification**

```bash
npm test
npm run gallery:test
npm run docs:build
git diff --check
git status --short
```

Expected: all Vitest tests pass, gallery tests pass, VuePress renders 11 pages, no whitespace errors, and only intentional changes remain.

- [ ] **Step 2: Check the live story page**

With `npm run docs:dev -- --host 127.0.0.1`, inspect `/gallery/2026-05-06/` at desktop and a 390px viewport. Verify the navbar/menu are absent, title/meta/intro are compact, frame border and 6px mat are visible, the bottom arrow is icon-only and accessible, and the lightbox arrows stay at the viewport edges without covering the image. Verify the close button is absent while background click, Esc, and arrows still work.

- [ ] **Step 3: Commit only necessary verification fixes**

If a concrete regression is found, add its regression test first, fix it, rerun the relevant commands, then commit:

```bash
git add <only-the-verified-fix-files>
git commit -m "fix(gallery): correct story presentation review finding"
```

If validation is clean, do not create an empty verification commit.
