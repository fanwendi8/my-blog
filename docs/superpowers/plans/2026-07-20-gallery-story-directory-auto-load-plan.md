# Gallery story directory auto-loading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Organize gallery source images by story directory and make `StoryAlbum` automatically render that story's ordered photos, including a cover image that may appear in the middle.

**Architecture:** A new source-scanning module will normalize each first-level story directory into ordered photo inputs, validating optional `order.json` and identifying `cover.*`. The gallery builder will attach `storySlug`, `storyOrder`, and `isCover` to the existing content-hash photo manifest. Runtime components will filter that manifest by story slug; the gallery home will resolve covers from the same manifest while retaining legacy frontmatter cover IDs as overrides.

**Tech Stack:** Node 20.19+/22 ESM `.mjs` scripts, Sharp derivatives, Vue 3/VuePress 2, TypeScript, Vitest with jsdom.

## Global Constraints

- Keep source code in ESM/TypeScript style and use `.mjs` for Node scripts.
- Generate derivatives through `npm run gallery:build`; do not hand-edit ignored generated assets.
- Keep content-hash photo IDs and existing CDN/R2 derivative filenames stable.
- Preserve `StoryPhoto`, `StoryPhotos`, and `StorySplit` as ID-based special-layout components.
- New story Markdown uses `<StoryAlbum story="<slug>" />` and does not list photo IDs.
- Run `npm run gallery:test`; after runtime/config changes also run `npm test` and `npm run docs:build`.

---

### Task 1: Add story-directory scanning and explicit ordering

**Files:**
- Create: `scripts/gallery/storySources.mjs`
- Create: `scripts/gallery/__tests__/storySources.test.mjs`

**Interfaces:**
- Produces `scanStorySources(stagingRoot): Promise<StorySource[]>`.
- `StorySource` is `{ slug: string, photos: StorySourcePhoto[] }`.
- `StorySourcePhoto` is `{ file: string, relativePath: string, storyOrder: number, isCover: boolean }`.
- `order.json` has the shape `{ order: string[] }`, with paths relative to its story directory and normalized to `/` separators.

- [ ] **Step 1: Write failing scanner tests**

Add tests that create temporary story directories and assert:

```js
const stories = await scanStorySources(root)
expect(stories).toEqual([{
  slug: '2026-05-06',
  photos: [
    expect.objectContaining({ relativePath: '01.jpg', storyOrder: 0, isCover: false }),
    expect.objectContaining({ relativePath: 'cover.jpg', storyOrder: 1, isCover: true }),
    expect.objectContaining({ relativePath: '02.jpg', storyOrder: 2, isCover: false }),
  ],
}])
```

Cover the lexical fallback, explicit `order.json` ordering, nested image paths, empty story directories, duplicate order entries, unknown paths, and omitted image paths. Use `mkdtemp`, `mkdir`, `writeFile`, and `rm` from `node:fs/promises`; keep all fixtures inside the temporary directory.

- [ ] **Step 2: Run the focused scanner tests and verify they fail**

Run:

```bash
npx vitest run scripts/gallery/__tests__/storySources.test.mjs
```

Expected: the test file fails because `scripts/gallery/storySources.mjs` does not yet export `scanStorySources`.

- [ ] **Step 3: Implement the scanner**

Implement recursive image discovery under each immediate child directory of `stagingRoot`. Ignore root files such as `meta.json` and non-image files. For each story:

1. Fail with `story "<slug>" contains no supported images` when no JPG/PNG exists.
2. Read optional `<storyDir>/order.json` and require an array containing every discovered image path exactly once.
3. Use the configured order when present, otherwise sort normalized relative paths lexically.
4. Mark the only image whose basename is `cover` as `isCover`; fail on multiple explicit cover files; if none exists, mark the first ordered image as the fallback cover.
5. Assign zero-based `storyOrder` after final ordering and return absolute source paths plus normalized relative paths.

Use a dedicated error helper so validation messages are deterministic and directly assertable in tests.

- [ ] **Step 4: Run the focused scanner tests and verify they pass**

Run the same Vitest command. Expected: all scanner tests pass.

- [ ] **Step 5: Commit the scanner module and tests**

```bash
git add scripts/gallery/storySources.mjs scripts/gallery/__tests__/storySources.test.mjs
git commit -m "feat(gallery): scan photos by story directory"
```

### Task 2: Feed story metadata into the gallery build

**Files:**
- Modify: `scripts/gallery/config.mjs`
- Modify: `scripts/gallery/build.mjs`
- Modify: `scripts/gallery/__tests__/build.test.mjs`
- Modify: `scripts/gallery/__tests__/config.test.mjs`

**Interfaces:**
- `config.mjs` exports one shared `PHOTO_DERIVATIVES` list: thumb WebP at 480px and large AVIF at 3840px.
- `createPhotoRecord({ id, src, size, fileMeta, previous, storySlug, storyOrder, isCover })` returns a record containing the three story fields plus the existing metadata fields.

- [ ] **Step 1: Add failing build assertions**

Extend `createPhotoRecord` tests with:

```js
expect(createPhotoRecord({
  id: 'photo-id',
  src: { thumb: { webp: 'photo-thumb.webp', w: 480 }, large: { avif: 'photo-large.avif', w: 3840 } },
  size: { w: 1200, h: 900 },
  fileMeta: {},
  storySlug: '2026-05-06',
  storyOrder: 1,
  isCover: true,
  previous: null,
})).toMatchObject({ storySlug: '2026-05-06', storyOrder: 1, isCover: true })
```

Update the existing `fileMetaKey` fixture from `stories/2.jpg` to `2026-05-06/02.jpg` and assert the same normalized result.

- [ ] **Step 2: Run the focused build tests and verify they fail**

Run:

```bash
npx vitest run scripts/gallery/__tests__/build.test.mjs
```

Expected: the new record assertion fails because the builder does not yet accept or return story fields.

- [ ] **Step 3: Implement the shared build path**

Import `scanStorySources` and `PHOTO_DERIVATIVES` in `build.mjs`. Replace the separate `covers`/`stories` scans and role selection with a flattening pass over `scanStorySources(PATHS.staging)`. For each source photo, compute the content hash, generate the shared derivatives, read metadata using the full path relative to `gallery-staging`, and pass `storySlug`, `storyOrder`, and `isCover` to `createPhotoRecord`.

Keep the existing previous-record reuse, manifest merge, stale-derivative pruning, dry-run, and optional upload behavior. The upload loop must continue to use the unchanged hash-based derivative paths.

- [ ] **Step 4: Run gallery tests and a real build**

Run:

```bash
npm run gallery:test
npm run gallery:build
```

Expected: all gallery tests pass; the build reports the number of story directories/photos and writes `photos.json` with the new fields.

- [ ] **Step 5: Commit the build integration**

```bash
git add scripts/gallery/config.mjs scripts/gallery/build.mjs scripts/gallery/__tests__/build.test.mjs scripts/gallery/__tests__/config.test.mjs
git commit -m "feat(gallery): attach story ordering to photo manifest"
```

### Task 3: Make `StoryAlbum` load a story automatically

**Files:**
- Modify: `docs/.vuepress/themes/gallery/types.ts`
- Modify: `docs/.vuepress/themes/components/gallery/StoryAlbum.vue`
- Modify: `docs/.vuepress/themes/__tests__/StoryAlbum.test.ts`

**Interfaces:**
- `Photo` gains optional migration-safe fields: `storySlug?: string`, `storyOrder?: number`, and `isCover?: boolean`; new generated records always include them.
- `StoryAlbum` accepts `{ story: string, captions?: Record<string, string | undefined> }`.

- [ ] **Step 1: Update the component test fixtures and add ordering assertions**

Give the fixture photos story metadata in a deliberately unsorted order, mount with `props: { story: '2026-05-06' }`, and assert the rendered image URLs follow `storyOrder`, exclude a photo from another story, and keep caption overrides. Update lightbox tests to assert the same filtered IDs are passed to `createStoryPhotoSwipeItems`.

- [ ] **Step 2: Run the focused component tests and verify they fail**

Run:

```bash
npx vitest run docs/.vuepress/themes/__tests__/StoryAlbum.test.ts
```

Expected: tests fail because `StoryAlbum` still requires `ids`.

- [ ] **Step 3: Implement story filtering**

Replace the required `ids` prop with `story`. Compute:

```ts
const albumPhotos = computed(() => photos.value
  .filter((photo) => photo.storySlug === props.story)
  .sort((a, b) => (a.storyOrder ?? 0) - (b.storyOrder ?? 0)))

const albumIds = computed(() => albumPhotos.value.map(({ id }) => id))
```

Use `albumIds.value` for the PhotoSwipe data source and retain the existing rendering, accessibility, modified-click, captions, and back-link behaviour.

- [ ] **Step 4: Run the focused component tests and verify they pass**

Run the same Vitest command. Expected: all StoryAlbum tests pass.

- [ ] **Step 5: Commit the automatic album interface**

```bash
git add docs/.vuepress/themes/gallery/types.ts docs/.vuepress/themes/components/gallery/StoryAlbum.vue docs/.vuepress/themes/__tests__/StoryAlbum.test.ts
git commit -m "feat(gallery): load story album photos automatically"
```

### Task 4: Resolve gallery-home covers from the photo manifest

**Files:**
- Modify: `docs/.vuepress/galleryStories.ts`
- Modify: `docs/.vuepress/themes/layouts/GalleryHome.vue`
- Modify: `docs/.vuepress/themes/__tests__/galleryStories.test.ts`
- Modify: `docs/.vuepress/themes/__tests__/GalleryHome.test.ts`

**Interfaces:**
- `readGalleryStories` includes Markdown stories even when `cover` is absent and returns `cover: null` for those stories.
- `GalleryHome.coverFor(story)` first honors a legacy `story.cover`, then finds the matching `storySlug` photo with `isCover`, then falls back to the lowest `storyOrder` photo.

- [ ] **Step 1: Add failing story-index and cover-resolution tests**

Change the story parser test so a Markdown story without `cover` remains indexed with `cover: null`. Add a GalleryHome fixture with two photos for one story and assert the `isCover` photo is used; add a fixture without `isCover` and assert the first `storyOrder` photo is used.

- [ ] **Step 2: Run the focused tests and verify they fail**

Run:

```bash
npx vitest run docs/.vuepress/themes/__tests__/galleryStories.test.ts docs/.vuepress/themes/__tests__/GalleryHome.test.ts
```

Expected: the no-cover story is currently omitted and the manifest-derived cover fallback is not implemented.

- [ ] **Step 3: Implement parser and cover fallback**

Remove the early `if (!cover) continue` from `readGalleryStories`; preserve explicit frontmatter covers as legacy values. In `GalleryHome.vue`, resolve the legacy ID first, then use `story.slug` to select `storySlug` records and their cover/order metadata. Return `null` only when no matching photo exists.

- [ ] **Step 4: Run focused tests and the full test suite**

Run:

```bash
npx vitest run docs/.vuepress/themes/__tests__/galleryStories.test.ts docs/.vuepress/themes/__tests__/GalleryHome.test.ts
npm test
```

Expected: focused tests and the complete Vitest suite pass.

- [ ] **Step 5: Commit the cover resolution**

```bash
git add docs/.vuepress/galleryStories.ts docs/.vuepress/themes/layouts/GalleryHome.vue docs/.vuepress/themes/__tests__/galleryStories.test.ts docs/.vuepress/themes/__tests__/GalleryHome.test.ts
git commit -m "feat(gallery): derive story covers from photo metadata"
```

### Task 5: Migrate the current story and document the new source layout

**Files:**
- Move: `gallery-staging/covers/1.jpg` to `gallery-staging/2026-05-06/cover.jpg`
- Move: `gallery-staging/stories/2.jpg` through `gallery-staging/stories/7.jpg` into `gallery-staging/2026-05-06/01.jpg` through `06.jpg`, preserving bytes
- Create: `gallery-staging/2026-05-06/order.json`
- Modify: `docs/gallery/2026-05-06.md`
- Modify: `scripts/gallery/README.md`
- Modify: `docs/.vuepress/themes/components/gallery/README.md`

**Interfaces:**
- The migrated `order.json` is `{ "order": ["01.jpg", "02.jpg", "03.jpg", "04.jpg", "cover.jpg", "05.jpg", "06.jpg"] }`, preserving the current page's visual sequence.
- The story page contains `<StoryAlbum story="2026-05-06" />`; existing exceptional caption overrides may remain keyed by stable photo ID.

- [ ] **Step 1: Move only the seven explicit source files**

Create `gallery-staging/2026-05-06/`, move the current cover to `cover.jpg`, and rename the current story files according to their existing content-hash IDs so the current order is preserved: old `4.jpg` → `01.jpg`, old `3.jpg` → `02.jpg`, old `5.jpg` → `03.jpg`, old `6.jpg` → `04.jpg`, old `2.jpg` → `05.jpg`, and old `7.jpg` → `06.jpg`.

- [ ] **Step 2: Write the order file and update Markdown**

Write `{ "order": ["01.jpg", "02.jpg", "03.jpg", "04.jpg", "cover.jpg", "05.jpg", "06.jpg"] }`. Replace the current `StoryAlbum` `ids` binding with `<StoryAlbum story="2026-05-06" />` and remove the now-unneeded frontmatter `cover` field; preserve the story prose and any caption overrides.

- [ ] **Step 3: Update gallery documentation**

Document the story-directory layout, `cover.*` convention, optional `order.json`, and the unified thumb/large derivative output in `scripts/gallery/README.md`. Update any component example that still presents `StoryAlbum ids` as the default interface.

- [ ] **Step 4: Rebuild and inspect the manifest**

Run:

```bash
npm run gallery:build
node --input-type=module -e "import fs from 'node:fs/promises'; const p=JSON.parse(await fs.readFile('docs/.vuepress/public/gallery/data/photos.json','utf8')); console.log(p.filter(x=>x.storySlug==='2026-05-06').map(x=>[x.storyOrder,x.isCover,x.id]));"
```

Expected: seven records are associated with `2026-05-06`, the cover record has `isCover: true`, and its `storyOrder` is `4`.

- [ ] **Step 5: Commit the migration and documentation**

```bash
git add docs/gallery/2026-05-06.md scripts/gallery/README.md docs/.vuepress/themes/components/gallery/README.md
git commit -m "feat(gallery): migrate story images to slug directories"
```

The ignored `gallery-staging/` move and generated assets remain local build inputs and are not staged.

### Task 6: Verify the running site and production build

**Files:**
- No source changes expected unless verification exposes a failing requirement.

- [ ] **Step 1: Run all required verification commands**

```bash
npm run gallery:test
npm test
npm run docs:build
```

Expected: every command exits with code 0; the production build includes the migrated story page and generated gallery assets.

- [ ] **Step 2: Verify the existing dev server serves the updated manifest**

Request `http://localhost:8081/gallery/data/photos.json` and confirm it contains seven `2026-05-06` records. Refresh `http://localhost:8081/gallery/2026-05-06/` and visually confirm the cover appears in the middle of the album.

- [ ] **Step 3: Commit any narrowly scoped verification fix**

If verification reveals a source defect, add a regression test first, fix only the relevant file, rerun the failing command and full verification, then commit with a Conventional Commit message describing that defect. If no defect appears, leave the verification step uncommitted.
