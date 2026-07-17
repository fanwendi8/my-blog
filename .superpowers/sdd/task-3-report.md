Status: completed

What changed:
- Updated `docs/.vuepress/themes/styles/_gallery.scss` only within the Story page section to narrow `.photo-story-header` and top-level story paragraphs to `min(620px, 100%)`, switch paragraph color/line-height to the required muted reading column, and keep existing title hierarchy and wall background intact.
- Reworked `.story-album` to the required desktop/tablet/mobile responsive rhythm: desktop keeps 4 columns with `gap: 44px 28px`, tablet uses 3 columns with `gap: 42px 28px` and `--story-tablet-offset`, mobile uses 2 columns with `gap: 32px 16px`, zeroes offset/transform, and reduces the mat inset/padding to `10px`.
- Updated `.story-album__item` / `.story-album__frame` / `.story-album__image` to preserve existing caption, return icon, PhotoSwipe, image source, and `no-view` behavior while adding the required controlled offset binding, 2px graphite border, white mat layer, inner image border, square corners, and right-lower floating shadow.
- Made the smallest mechanical test alignment in `docs/.vuepress/themes/__tests__/StoryAlbum.test.ts` and `docs/.vuepress/themes/__tests__/PhotoStoryHeader.test.ts` so the assertions match the brief’s actual selector/value placement (`margin: 0 0 28px`, mobile `gap: 32px 16px`, desktop album gap living on the base `.story-album` rule instead of a desktop media block).

Exact test commands and outputs:
- `npm test -- docs/.vuepress/themes/__tests__/StoryAlbum.test.ts docs/.vuepress/themes/__tests__/PhotoStoryHeader.test.ts`
  - Output:
    - `Test Files  2 passed (2)`
    - `Tests  11 passed (11)`
    - `Duration  1.63s (transform 193ms, setup 0ms, import 531ms, tests 92ms, environment 2.09s)`
- `npm test`
  - Output:
    - `Test Files  20 passed (20)`
    - `Tests  79 passed (79)`
    - `Duration  2.98s (transform 863ms, setup 0ms, import 2.34s, tests 1.63s, environment 16.44s)`

Files changed:
- `docs/.vuepress/themes/styles/_gallery.scss`
- `docs/.vuepress/themes/__tests__/StoryAlbum.test.ts`
- `docs/.vuepress/themes/__tests__/PhotoStoryHeader.test.ts`

Self-review:
- Confirmed the new rules stay inside the Story page / Story album block and do not touch Gallery home selectors.
- Confirmed hover remains opacity-only, captions stay plain-text with the 48px line, and back-link / PhotoSwipe behavior was not modified.
- Confirmed the only test edits are mechanical selector/value alignment with the approved Task 3 brief.

Concerns:
- This turn verified via Vitest only; I did not spin up `docs:dev`, so any final visual nuance should be checked in-browser if you want pixel-level confirmation.

Review fix follow-up (2026-07-17):

- Fixed the wide desktop cascade regression in `docs/.vuepress/themes/styles/_gallery.scss` by keeping the Story paragraph rule at `line-height: 1.75` inside `@media (min-width: 1280px)`, so the approved reading-column contract now holds at 1440px without touching unrelated typography.
- Added the smallest focused style-string regression assertion in `docs/.vuepress/themes/__tests__/PhotoStoryHeader.test.ts` to verify the 1280px Story paragraph rule preserves `line-height: 1.75`.

Exact commands and outputs:

- `npm test -- docs/.vuepress/themes/__tests__/PhotoStoryHeader.test.ts docs/.vuepress/themes/__tests__/StoryAlbum.test.ts`
  - Output:
    - `Test Files  2 passed (2)`
    - `Tests  11 passed (11)`
    - `Duration  540ms (transform 99ms, setup 0ms, import 237ms, tests 59ms, environment 606ms)`
- `npm test`
  - Output:
    - `Test Files  20 passed (20)`
    - `Tests  79 passed (79)`
    - `Duration  2.71s (transform 813ms, setup 0ms, import 2.14s, tests 1.62s, environment 15.45s)`
