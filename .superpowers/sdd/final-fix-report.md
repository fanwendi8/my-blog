# Final Review Fix Report

## Status

Completed and committed.

- Commit: `888360f8acc085ef40667697dd7b24fba8d3fc21` (`fix(gallery): stabilize story source ordering`)
- Branch: `dev`
- Tracked generated manifest was rebuilt from the current `gallery-staging/` inputs; it was not hand-edited.

## Files changed in the commit

- `AGENTS.md`
- `docs/.vuepress/public/gallery/data/photos.json`
- `scripts/gallery/storySources.mjs`
- `scripts/gallery/__tests__/storySources.test.mjs`

No ignored gallery images or files under `docs/.vuepress/public/gallery-img/` were staged.

## Implemented fixes

1. Replaced the fallback image-path `localeCompare` with the locale-independent code-point comparator `a < b ? -1 : a > b ? 1 : 0`.
2. Added a focused regression test with mixed-case and Unicode paths. The red test showed locale collation placed `z.jpg` after `Å.jpg`, `ä.jpg`, and `é.jpg`; the code-point comparator now produces the stable required order.
3. Regenerated the tracked photo manifest from staging inputs, preserving the story metadata fields.
4. Updated the project workflow documentation: frontmatter `cover` is optional legacy data, GalleryHome resolves manifest covers, staging uses per-story directories with optional `order.json` and `cover.jpg`, and `StoryAlbum story="..."` is the default automatic album component while ID-based components remain documented for custom layouts.

## Commands and results

| Command | Result |
| --- | --- |
| `npm test -- scripts/gallery/__tests__/storySources.test.mjs` (RED) | Failed as expected: 1 failing / 7 passing. Locale collation ordered accented paths before `z.jpg`, contrary to code-point order. |
| `npm test -- scripts/gallery/__tests__/storySources.test.mjs` (GREEN) | Passed: 1 test file, 8 tests. |
| `npm run gallery:build` | Passed: found 1 story directory and 7 photos; wrote the manifest to `docs/.vuepress/public/gallery/data`. |
| Manifest inspection with `node --input-type=module -e "…"` | Confirmed 7 `storySlug: "2026-05-06"` records; `storyOrder` exactly `0,1,2,3,4,5,6`; only cover order is `4` (`afb0b234ec65`). |
| `npm run gallery:test` | Passed: 8 test files, 36 tests. |
| `npm test` | Passed: 21 test files, 93 tests. |
| `npm run docs:build` | Passed: VuePress rendered 21 pages and completed in 2.87s. |
| `git diff --check` | Passed with exit code 0. |
| `git diff --cached --check` | Passed with exit code 0 after staging. |
| `git commit -m "fix(gallery): stabilize story source ordering"` | Passed; created commit `888360f8acc085ef40667697dd7b24fba8d3fc21`. |

## Self-review

- Scope is limited to the requested comparator, regression test, generated manifest, and AGENTS workflow cleanup.
- The comparator only changes fallback ordering for image paths; story-directory sorting remains untouched.
- The regression test exercises real filesystem discovery, includes mixed case plus Unicode names, and was observed failing before the production comparator was applied.
- The rebuilt manifest was inspected after generation and contains the requested story metadata and cover placement.
- The staged-file list contained only the four tracked files above; ignored generated gallery assets were not staged.
