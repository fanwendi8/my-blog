# Photo Story Gallery Design

## Background

The current gallery was designed as a photo-first archive: it extracts rich photo metadata, builds tag and album manifests, renders a timeline stream, and opens photos in a detail-heavy lightbox. After comparing the desired direction with The Post Chaise, the better model is story-first:

- `/gallery/` is an index of photographic stories.
- Each story is a real Markdown page with prose.
- The page can include a Vue gallery component where the ordered images should appear.
- Clicking a story image opens a clean full-image viewer without EXIF, tags, GPS, or side panels.

This keeps VuePress Plume as the site framework and uses Markdown for writing, while custom Vue components handle image rendering and lightbox behavior.

## Goals

- Turn Gallery from a photo database into a lightweight photographic journal.
- Let each photo story be authored as Markdown.
- Keep structured story data in frontmatter: title, date, location, cover, and ordered photo ids.
- Keep image data minimal: id, src, width, height, alt/title, optional caption.
- Remove detailed EXIF/GPS/tag UI from the visitor experience.
- Remove blurhash and heavy placeholder assumptions from the new model.
- Preserve a polished `/gallery/` index grouped by year.
- Use real story URLs such as `/gallery/cyprus-2023/`.

## Non-Goals

- No per-photo technical metadata panel.
- No tag filter system.
- No all-photos timeline view.
- No automatic image story generation from EXIF.
- No CMS.
- No long-term optimization for thousands of images in the first refactor.

## Content Model

### Story Markdown

Each story lives under `docs/gallery/<slug>.md`.

Example:

```md
---
title: Cyprus
date: 2023-10-22
location: Cyprus
cover: d183827a702
photos:
  - d183827a702
  - 4f6d63adca0
  - a3bfcaa4dc9
permalink: /gallery/cyprus-2023/
pageClass: photo-story-page
---

<PhotoStoryHeader />

Vestiges of ancient empires.

Long-form writing can live here as normal Markdown.

<PhotoStoryGallery />
```

### Runtime Manifests

The gallery still uses JSON manifests in `docs/.vuepress/public/gallery/data/`, but they become smaller.

`photos.json`:

```json
[
  {
    "id": "d183827a702",
    "src": "/gallery-img/d183827a702/large.webp",
    "w": 4000,
    "h": 3000,
    "alt": "A harbour before a storm",
    "caption": "Harbour light before rain."
  }
]
```

`stories.json`:

```json
[
  {
    "slug": "cyprus-2023",
    "title": "Cyprus",
    "date": "2023-10-22",
    "location": "Cyprus",
    "cover": "d183827a702",
    "photos": ["d183827a702", "4f6d63adca0", "a3bfcaa4dc9"],
    "path": "/gallery/cyprus-2023/"
  }
]
```

`tags.json` and `albums.json` stop being part of the public contract for the story UI.

## Architecture

### `/gallery/` Index

`docs/gallery/README.md` remains the custom home page with `type: gallery-home`. `GalleryHome.vue` changes from timeline/tag navigation to story index:

- fetch `stories.json` and `photos.json`
- resolve each story cover photo
- group stories by year from `story.date`
- render compact cards similar to the reference site
- link cards to `story.path`

### Story Pages

Story pages are normal VuePress Markdown pages. Two global client components are registered:

- `PhotoStoryHeader`: reads current page frontmatter and renders title/date/location.
- `PhotoStoryGallery`: reads current page frontmatter `photos`, resolves photo objects from `photos.json`, renders a vertical image sequence, and opens the clean lightbox on click.

The author can put these components anywhere in Markdown. This keeps layout flexible and lets prose appear before, between, or after image sections later.

### Lightbox

The lightbox becomes a clean viewer:

- no right panel
- no EXIF
- no tags
- no map link
- image fits inside the viewport
- close button and optional previous/next controls only

Existing PhotoSwipe usage can remain because it already handles zoom, swipe, keyboard, and image fitting well.

## Files

Primary changes:

- `docs/.vuepress/themes/gallery/types.ts`
- `docs/.vuepress/themes/composables/useGalleryData.ts`
- `docs/.vuepress/themes/layouts/GalleryHome.vue`
- `docs/.vuepress/themes/components/gallery/Lightbox.vue`
- `docs/.vuepress/themes/components/gallery/PhotoStoryHeader.vue`
- `docs/.vuepress/themes/components/gallery/PhotoStoryGallery.vue`
- `docs/.vuepress/client.ts`
- `docs/.vuepress/themes/styles/_gallery.scss`
- `scripts/gallery/manifest.mjs`
- `scripts/gallery/build.mjs`

Likely retired from the main path:

- `PhotoInfoPanel.vue`
- `TabTimeline.vue`
- `YearTimeline.vue`
- `AlbumDetail.vue`
- tag/filter route state in `useGalleryRoute.ts`
- blurhash-specific UI in `PhotoTile.vue`

The retired files can either be deleted in the refactor or left temporarily if doing a lower-risk migration. The recommended final state is deletion once tests pass.

## Migration Strategy

1. Add the new `PhotoStory` data model and `stories.json` support while keeping old files untouched.
2. Add `PhotoStoryHeader` and `PhotoStoryGallery` for Markdown pages.
3. Convert `/gallery/` to story index.
4. Simplify `Lightbox`.
5. Remove old timeline/tag/detail components and tests.
6. Simplify the gallery build scripts so future maintenance matches the new smaller mental model.

## Testing

- Unit-test manifest generation for `stories.json`.
- Unit-test `useGalleryData` loading `photos.json` and `stories.json`.
- Unit-test `GalleryHome` grouping and linking stories by year.
- Unit-test `PhotoStoryGallery` resolving frontmatter photo ids into ordered images.
- Unit-test `Lightbox` rendering without the old panel.
- Run `npm test`.
- Run `npm run docs:build`.
- Use browser verification on `/gallery/` and one story page.
