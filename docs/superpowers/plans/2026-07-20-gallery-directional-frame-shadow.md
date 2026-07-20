# Gallery Directional Frame Shadow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Story album's surrounding shadow halo with a layered shadow cast consistently toward the lower right from an upper-left light source.

**Architecture:** Keep the existing frame, mat, and inset edge shadows unchanged. Express the three exterior shadows as CSS custom properties on `.story-album__frame`, then override only those properties at the mobile breakpoint so every viewport preserves the same light direction with proportionate reach.

**Tech Stack:** VuePress 2, SCSS, Vitest, in-app browser visual verification

## Global Constraints

- Only Story album frame shadows may change.
- The frame surface remains solid warm graphite `#4A4943`; no gradient or obvious highlight may be added.
- The light source is upper left and all exterior shadows fall toward the lower right.
- Negative spread values must keep the top and left edges free of a surrounding halo.
- Desktop and tablet use the full three-layer shadow; mobile uses reduced offsets and blur.
- Existing frame dimensions, mat dimensions, layout, captions, and Lightbox behavior remain unchanged.

---

### Task 1: Directional Story Frame Shadow

**Files:**
- Modify: `docs/.vuepress/themes/styles/_gallery.scss:278`
- Test: `docs/.vuepress/themes/__tests__/StoryAlbum.test.ts:138`

**Interfaces:**
- Consumes: `.story-album__frame` and the existing `@media (max-width: 719px)` frame override.
- Produces: `--story-shadow-contact`, `--story-shadow-main`, and `--story-shadow-ambient` CSS custom properties consumed by the frame's `box-shadow` declaration.

- [ ] **Step 1: Write the failing directional-shadow style contract**

Add base and mobile rule extraction to the existing graphite-frame test and assert the exact directional layers:

```ts
expect(frameRule).toMatch(/--story-shadow-contact:\s*3px 4px 6px -3px rgba\(38, 36, 31, \.28\)/)
expect(frameRule).toMatch(/--story-shadow-main:\s*10px 14px 24px -10px rgba\(38, 36, 31, \.24\)/)
expect(frameRule).toMatch(/--story-shadow-ambient:\s*18px 24px 42px -18px rgba\(38, 36, 31, \.16\)/)
expect(frameRule).toMatch(/var\(--story-shadow-contact\)/)
expect(frameRule).toMatch(/var\(--story-shadow-main\)/)
expect(frameRule).toMatch(/var\(--story-shadow-ambient\)/)
expect(mobileFrameRule).toMatch(/--story-shadow-contact:\s*2px 3px 4px -2px rgba\(38, 36, 31, \.26\)/)
expect(mobileFrameRule).toMatch(/--story-shadow-main:\s*6px 9px 14px -7px rgba\(38, 36, 31, \.22\)/)
expect(mobileFrameRule).toMatch(/--story-shadow-ambient:\s*10px 14px 24px -12px rgba\(38, 36, 31, \.14\)/)
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- --run docs/.vuepress/themes/__tests__/StoryAlbum.test.ts
```

Expected: FAIL because the three `--story-shadow-*` properties do not exist and the current shadows use zero horizontal offsets.

- [ ] **Step 3: Implement the desktop/tablet directional shadow**

Define the three exterior layers at the start of `.story-album__frame` and consume them after the two existing inset shadows:

```scss
.story-album__frame {
  --story-mat-inset: clamp(20px, 2vw, 24px);
  --story-shadow-contact: 3px 4px 6px -3px rgba(38, 36, 31, .28);
  --story-shadow-main: 10px 14px 24px -10px rgba(38, 36, 31, .24);
  --story-shadow-ambient: 18px 24px 42px -18px rgba(38, 36, 31, .16);

  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, .38),
    inset 0 -2px 0 rgba(22, 24, 21, .48),
    var(--story-shadow-contact),
    var(--story-shadow-main),
    var(--story-shadow-ambient);
}
```

- [ ] **Step 4: Implement the reduced mobile shadow**

Add only custom-property overrides to the existing mobile `.story-album__frame` rule:

```scss
--story-shadow-contact: 2px 3px 4px -2px rgba(38, 36, 31, .26);
--story-shadow-main: 6px 9px 14px -7px rgba(38, 36, 31, .22);
--story-shadow-ambient: 10px 14px 24px -12px rgba(38, 36, 31, .14);
```

- [ ] **Step 5: Run the focused test and verify GREEN**

Run:

```bash
npm test -- --run docs/.vuepress/themes/__tests__/StoryAlbum.test.ts
```

Expected: `StoryAlbum.test.ts` passes with all existing layout, frame, mat, caption, navigation, and Lightbox assertions intact.

- [ ] **Step 6: Build and visually verify desktop and mobile**

Run:

```bash
npm run docs:build
```

Reload `http://127.0.0.1:8080/gallery/2026-05-06/`, inspect a desktop viewport and a 390px mobile viewport, and verify:

- shadow weight is concentrated below and to the right;
- top and left edges have no obvious surrounding halo;
- all frames share one light direction;
- neither viewport has horizontal overflow.

- [ ] **Step 7: Run full verification**

Run:

```bash
npm test
git diff --check
```

Expected: all Vitest files pass and `git diff --check` produces no output.

- [ ] **Step 8: Commit the isolated shadow change**

```bash
git add docs/.vuepress/themes/styles/_gallery.scss docs/.vuepress/themes/__tests__/StoryAlbum.test.ts docs/superpowers/plans/2026-07-20-gallery-directional-frame-shadow.md
git commit -m "style(gallery): direct frame shadows down right"
```
