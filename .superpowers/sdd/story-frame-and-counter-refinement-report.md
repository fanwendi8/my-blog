# Story Frame and Counter Refinement Report

## Scope

- Story prose, headings, and supported text containers now use `--story-media-width`, matching the album/media edge instead of a separate 600px column.
- Story album thumbnails retain a white 6px inner mat, 4:3 layout, and `object-fit: contain`, but use eight 1px `#cfcfcf` background-gradient segments to form four short L-shaped corner marks. The continuous border, radius, and shadow styling are absent; hover remains image-opacity-only.
- The Story lightbox counter no longer overrides PhotoSwipe positioning or alignment, so it returns to PhotoSwipe's original top-left placement.

## TDD evidence

### RED

Command:

```bash
npm test -- docs/.vuepress/themes/__tests__/PhotoStoryHeader.test.ts docs/.vuepress/themes/__tests__/StoryAlbum.test.ts docs/.vuepress/themes/__tests__/photoSwipeOptions.test.ts
```

Result: failed as expected in all three new contracts:

- Story text still resolved to `var(--story-text-width)`.
- The album frame still used a continuous `1px solid #cfcfcf` border instead of corner marks.
- The Story counter still used fixed bottom-centred positioning.

### GREEN

The same focused command passed after the scoped style implementation: 3 files, 17 tests.

Regression verification also passed:

```bash
npm test                 # 20 files, 79 tests
npm run gallery:test     # 7 files, 25 tests
npm run docs:build       # VuePress production build, 13 pages
git diff --check
```

## Corner-mark rationale

The short corner lines preserve a quiet visual boundary and the white mat's separation around mixed-orientation images, without turning every thumbnail into a heavy physical picture frame. Background gradients keep the marks decorative and scoped to StoryAlbum frames, while avoiding extra markup or changes to gallery-home, blog, notes, or global PhotoSwipe behavior.
