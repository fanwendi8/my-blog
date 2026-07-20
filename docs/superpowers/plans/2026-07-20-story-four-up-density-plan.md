# Story Four-Up Density Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Story desktop rows fit at least four photos while preserving ratio-aware widths, centered row geometry, slightly thicker frames/mats, and shared text/media bounds.

**Architecture:** Keep the current Flex-wrap album and CSS custom-property basis contract. Add an optional maximum span to the ratio-to-span helper; desktop uses 12 columns with target area 8 and max span 3, while tablet/mobile retain their existing density rules. Keep `_gallery.scss` responsible for viewport media width, text alignment, cross-axis centering, and frame materials.

**Tech Stack:** Vue 3, TypeScript, VuePress 2, SCSS, Vitest, Vue Test Utils.

## Global Constraints

- Use the existing VuePress 2 + Plume theme structure and ESM/TypeScript style.
- Do not change Story photo order, manifest data, image derivatives, CDN URLs, or PhotoSwipe behavior.
- At desktop widths, use `targetArea = 8` and `maxSpan = 3` for the 12-column ratio-aware layout.
- Use `min(1600px, calc(100vw - 96px))` below the 4K-wide breakpoint and `min(2200px, calc(100vw - 96px))` at viewport widths ≥ `3200px`.
- Preserve the existing tablet and mobile density fallbacks and avoid runtime viewport measurement or manual row grouping.

---

### Task 1: Lock the four-up layout contracts with failing tests

**Files:**
- Modify: `docs/.vuepress/themes/__tests__/StoryAlbum.test.ts`
- Modify: `docs/.vuepress/themes/__tests__/PhotoStoryHeader.test.ts`

**Interfaces:**
- Consumes: Current StoryAlbum inline style variables and `_gallery.scss` style-contract parsing.
- Produces: Test expectations for the capped desktop span, centered rows, shared media width, and modestly enlarged materials.

- [ ] **Step 1: Update inline basis expectations**

In `StoryAlbum.test.ts`, change the existing first test to expect the portrait photo at 2/12 desktop and the landscape photo at the capped 3/12 desktop basis:

```ts
expect(wrapper.findAll('.story-album__item')[0].attributes('style'))
  .toContain('--story-flex-basis: calc(16.6667% - 16.6667px)')
expect(wrapper.findAll('.story-album__item')[0].attributes('style'))
  .toContain('--story-flex-basis-tablet: calc(33.3333% - 13.3333px)')
expect(wrapper.findAll('.story-album__item')[1].attributes('style'))
  .toContain('--story-flex-basis: calc(25.0000% - 15.0000px)')
expect(wrapper.findAll('.story-album__item')[1].attributes('style'))
  .toContain('--story-flex-basis-tablet: calc(50.0000% - 10.0000px)')
```

Keep the existing mobile expectations unchanged.

- [ ] **Step 2: Update StoryAlbum style-contract expectations**

Change the album width assertion, add the cross-axis center assertion, and update material values:

```ts
expect(albumRule).toMatch(/align-items:\s*center/)
expect(albumRule).toMatch(/max-width:\s*var\(--story-media-width\)/)
expect(frameRule).toMatch(/border:\s*7px solid var\(--story-frame-color\)/)
expect(frameRule).toMatch(/--story-mat-inset:\s*clamp\(16px,\s*1\.5vw,\s*20px\)/)
expect(tabletFrameRule).toMatch(/border:\s*6px solid var\(--story-frame-color\)/)
expect(tabletFrameRule).toMatch(/--story-mat-inset:\s*clamp\(11px,\s*1\.35vw,\s*16px\)/)
expect(mobileFrameRule).toMatch(/border:\s*6px solid var\(--story-frame-color\)/)
expect(mobileFrameRule).toMatch(/--story-mat-inset:\s*8px/)
```

- [ ] **Step 3: Update the story text width contract**

In `PhotoStoryHeader.test.ts`, rename the style test to `aligns story text with the full media column`, replace both 620px expectations, and add the two desktop width-token assertions:

```ts
expect(headerRule).toMatch(/max-width:\s*var\(--story-media-width\)/)
expect(paragraphRule).toMatch(/max-width:\s*var\(--story-media-width\)/)
expect(styles).toMatch(/--story-media-width:\s*min\(1600px,\s*calc\(100vw - 96px\)\)/)
expect(styles).toMatch(/@media\s*\(min-width:\s*3200px\)[\s\S]*--story-media-width:\s*min\(2200px,\s*calc\(100vw - 96px\)\)/)
```

- [ ] **Step 4: Run focused tests to verify the old implementation fails**

Run:

```bash
npx vitest run docs/.vuepress/themes/__tests__/StoryAlbum.test.ts docs/.vuepress/themes/__tests__/PhotoStoryHeader.test.ts
```

Expected: failures are limited to the new basis, width, alignment, and material assertions; existing rendering and PhotoSwipe assertions remain passing.

### Task 2: Implement capped ratio-aware desktop density

**Files:**
- Modify: `docs/.vuepress/themes/components/gallery/StoryAlbum.vue`

**Interfaces:**
- Consumes: The current `gridSpanForRatio(ratio, columns, targetArea)` helper and Task 1 expectations.
- Produces: `gridSpanForRatio(ratio, columns, targetArea, maxSpan = columns)` and desktop `itemStyle` tokens that never exceed 3/12.

- [ ] **Step 1: Add the optional span cap**

Change the helper signature and return expression without changing its ratio clamp:

```ts
function gridSpanForRatio(ratio: number, columns: number, targetArea: number, maxSpan = columns) {
  const safeRatio = Math.min(4, Math.max(.25, ratio))
  return Math.min(columns, maxSpan, Math.max(1, Math.round(Math.sqrt(safeRatio * targetArea))))
}
```

- [ ] **Step 2: Set desktop density inputs**

In `itemStyle`, use the capped desktop calculation and retain current tablet/mobile calculations:

```ts
const desktopSpan = gridSpanForRatio(ratio, 12, 8, 3)
const tabletSpan = gridSpanForRatio(ratio, 6, 8)
const mobileSpan = ratio < .85 ? 1 : 2
```

Keep returned CSS variable names, gap values, frame ratio style, sorting, and PhotoSwipe logic unchanged.

- [ ] **Step 3: Run StoryAlbum tests**

Run `npx vitest run docs/.vuepress/themes/__tests__/StoryAlbum.test.ts`.

Expected: all StoryAlbum tests pass, including the new 2/12 portrait and 3/12 landscape basis assertions.

### Task 3: Implement shared width, centered rows, and modest material scale

**Files:**
- Modify: `docs/.vuepress/themes/styles/_gallery.scss`

**Interfaces:**
- Consumes: StoryAlbum basis variables from Task 2.
- Produces: Shared desktop width tiers, full-width Story text, centered Flex rows, and specified frame/mat values.

- [ ] **Step 1: Change media-width tokens**

Set the base variable and add the wide-screen override near `.photo-story-page`:

```scss
.photo-story-page {
  --story-media-width: min(1600px, calc(100vw - 96px));
}

@media (min-width: 3200px) {
  .photo-story-page {
    --story-media-width: min(2200px, calc(100vw - 96px));
  }
}
```

Do not remove existing mobile/tablet overrides.

- [ ] **Step 2: Align text and album to the shared width**

Change `max-width: min(620px, 100%)` for `.photo-story-header` and the two Story intro paragraph selectors to `max-width: var(--story-media-width)`. Change base `.story-album` max-width to the same variable. Keep margins, typography, and text alignment unchanged.

- [ ] **Step 3: Center rows and update frame materials**

Change only these declarations:

```scss
.story-album {
  align-items: center;
  max-width: var(--story-media-width);
}

.story-album__frame {
  --story-mat-inset: clamp(16px, 1.5vw, 20px);
  border: 7px solid var(--story-frame-color);
}

@media (min-width: 720px) and (max-width: 1199px) {
  .story-album__frame {
    --story-mat-inset: clamp(11px, 1.35vw, 16px);
    border: 6px solid var(--story-frame-color);
  }
}

@media (max-width: 719px) {
  .story-album__frame {
    --story-mat-inset: 8px;
    border: 6px solid var(--story-frame-color);
  }
}
```

Preserve aspect ratio, image object-fit, shadows, captions, and lightbox styles.

- [ ] **Step 4: Run focused component tests**

Run `npx vitest run docs/.vuepress/themes/__tests__/StoryAlbum.test.ts docs/.vuepress/themes/__tests__/PhotoStoryHeader.test.ts`.

Expected: all tests in both files pass.

### Task 4: Verify visual behavior, build, and commit

**Files:**
- Verify: `docs/.vuepress/themes/components/gallery/StoryAlbum.vue`
- Verify: `docs/.vuepress/themes/styles/_gallery.scss`
- Verify: `docs/.vuepress/themes/__tests__/StoryAlbum.test.ts`
- Verify: `docs/.vuepress/themes/__tests__/PhotoStoryHeader.test.ts`

**Interfaces:**
- Consumes: Complete four-up density implementation from Tasks 2–3.
- Produces: Passing repository checks and visual evidence at requested desktop and responsive widths.

- [ ] **Step 1: Run the complete test suite**

Run `npm test`.

Expected: Vitest exits with code 0 and no failed test files.

- [ ] **Step 2: Build the VuePress site**

Run `npm run docs:build`.

Expected: VuePress completes successfully and writes `docs/.vuepress/dist`.

- [ ] **Step 3: Check whitespace and focused diff**

Run:

```bash
git diff --check
git diff -- docs/.vuepress/themes/components/gallery/StoryAlbum.vue docs/.vuepress/themes/styles/_gallery.scss docs/.vuepress/themes/__tests__/StoryAlbum.test.ts docs/.vuepress/themes/__tests__/PhotoStoryHeader.test.ts
```

Expected: no whitespace errors and no changes outside ratio spans, width tokens, centering, material scale, and related tests.

- [ ] **Step 4: Inspect the running Story page**

Use `http://localhost:8080/gallery/2026-05-06/` at 2560px, 3840px, 1280px, 820px, and mobile widths. Confirm rows with enough photos start at four items on desktop, each row is horizontally centered, the first row's frame centerlines align, text and album share bounds, and no viewport has horizontal overflow.

- [ ] **Step 5: Commit the implementation**

Run:

```bash
git add docs/.vuepress/themes/components/gallery/StoryAlbum.vue docs/.vuepress/themes/styles/_gallery.scss docs/.vuepress/themes/__tests__/StoryAlbum.test.ts docs/.vuepress/themes/__tests__/PhotoStoryHeader.test.ts
git commit -m "style(gallery): increase story album density"
```

Expected: a Conventional Commit is created with only the four implementation/test files staged.
