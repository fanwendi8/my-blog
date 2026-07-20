# Final Review Fix Report

## Status

Implemented and verified. This report is committed with the tracked fixes below.

No ignored gallery images or files under `docs/.vuepress/public/gallery-img/` were staged.

## Implemented fixes

1. `scripts/gallery/storySources.mjs` now exports the shared locale-independent `compareCodePoints()` helper and uses it for story-directory ordering as well as fallback image-path ordering.
2. Added a filesystem regression test proving deterministic code-point story order for mixed-case and Unicode directory names: `A-first-story`, `a-second-story`, `z-story`, `Å-story`, `ä-story`, `é-story`, and `你-story`.
3. `scripts/gallery/build.mjs` imports the shared comparator and uses it for duplicate-hash ordering by id and source path. The duplicate rejection message and behavior remain unchanged.
4. Added a Unicode source-path duplicate-diagnostic regression test.
5. Updated `AGENTS.md`: `storySources.mjs` is documented as the story-directory scanner, and `scan.mjs` as the image-hashing/legacy scanning helper. Existing workflow documentation remains intact.

## TDD evidence

### RED

Command:

```text
npm test -- scripts/gallery/__tests__/storySources.test.mjs scripts/gallery/__tests__/build.test.mjs
```

Exact result before the production change:

```text
Test Files  2 failed (2)
Tests  2 failed | 13 passed (15)
```

The duplicate diagnostic received `a-story/photo.jpg` before `A-story/photo.jpg`; the story scan received `a-story`, `Å-story`, `ä-story`, `é-story`, `z-story`, `你-story` rather than code-point order.

### GREEN

Command:

```text
npm test -- scripts/gallery/__tests__/storySources.test.mjs scripts/gallery/__tests__/build.test.mjs
```

Exact result after the production change:

```text
Test Files  2 passed (2)
Tests  15 passed (15)
```

## Required verification

| Command | Exact result |
| --- | --- |
| `npm run gallery:build` | `[gallery] found 1 story directories, 7 photos` and `[gallery] manifest written -> /Users/fanwendi/work/vibe_coding/my-blog/docs/.vuepress/public/gallery/data` |
| Manifest inspection | `{"count":7,"orders":[0,1,2,3,4,5,6],"covers":[4]}` |
| `npm run gallery:test` | `Test Files  8 passed (8)`; `Tests  38 passed (38)` |
| `npm test` | `Test Files  21 passed (21)`; `Tests  95 passed (95)` |
| `npm run docs:build` | `success VuePress build completed in 2.74s!` after rendering 21 pages |
| `git diff --check` | Exit code 0; no output |
| `git diff --cached --check` | Run after staging; exit code 0; no output |

## Staged tracked files

- `AGENTS.md`
- `.superpowers/sdd/final-fix-report.md`
- `scripts/gallery/storySources.mjs`
- `scripts/gallery/build.mjs`
- `scripts/gallery/__tests__/storySources.test.mjs`
- `scripts/gallery/__tests__/build.test.mjs`
