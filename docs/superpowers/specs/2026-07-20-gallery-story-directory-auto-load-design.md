# Gallery story directory auto-loading

## Status

Design approved in conversation; implementation pending.

## Context

The gallery currently scans two staging directories, `covers/` and `stories/`.
Both roles already generate the same `thumb.webp` and `large.avif` derivatives,
so the role split no longer provides useful behaviour. Story Markdown also has
to maintain an explicit list of photo IDs for `StoryAlbum`, while the source
images already have a natural story grouping.

## Goals

- Organize source images by stable story slug, such as
  `gallery-staging/2026-05-06/`.
- Generate both thumbnail and large derivatives for every image.
- Make `StoryAlbum` load all images for a story automatically, in source order.
- Derive the gallery index cover from `cover.*` in the story directory.
- Keep content-hash photo IDs and existing CDN/R2 object names stable.
- Preserve the ID-based special layout components for editorial exceptions.

## Non-goals

- Replacing the content-hash asset naming scheme.
- Changing the visual layout or PhotoSwipe behaviour.
- Removing `StoryPhoto`, `StoryPhotos`, or `StorySplit`.
- Automatically inferring captions from prose in Markdown.

## Source layout

Each immediate child directory of `gallery-staging/` is a story slug. Image
files may be nested below that directory and are scanned recursively.

```text
gallery-staging/
└── 2026-05-06/
    ├── cover.jpg
    ├── 01.jpg
    ├── 02.jpg
    ├── 03.jpg
    └── order.json
```

`cover.*` identifies the story cover. The builder requires at least one image
per story and uses the first sorted image as a fallback cover if no explicit
cover file exists. The story slug should match the corresponding Markdown file
name in `docs/gallery/`. `order.json` is optional; when present, its `order`
array contains every image path relative to the story directory exactly once:

```json
{
  "order": ["01.jpg", "02.jpg", "cover.jpg", "03.jpg"]
}
```

This separates cover identity from album position, so `cover.jpg` can appear
in the middle of a story. Without `order.json`, the builder falls back to
lexical path order.

## Build and manifest

The gallery build module will replace the `covers/` and `stories/` scan with a
story-directory scan. Every image uses one shared derivative specification:
`thumb.webp` at 480px and `large.avif` up to 3840px.

Each photo record gains:

- `storySlug`: the immediate story directory name;
- `storyOrder`: the explicit `order.json` position, or deterministic lexical
  order when no order file exists;
- `isCover`: whether the file is the story's explicit or fallback cover.

The existing `id`, dimensions, metadata, and hash-based derivative paths stay
unchanged. Manifest ordering remains deterministic, while `StoryAlbum` sorts
by `storyOrder` after filtering by `storySlug`.

The builder continues to prune stale derivatives and write only
`photos.json`; story metadata remains Markdown-derived.

## Runtime interface

`StoryAlbum` changes from an `ids`-based required prop to a story-based
interface:

```vue
<StoryAlbum story="2026-05-06" />
```

It filters the loaded photo manifest by `storySlug`, sorts by `storyOrder`,
and passes the resulting photos to the existing thumbnail, large-image, and
PhotoSwipe helpers. An optional caption override map may remain for backwards
compatibility, but loading a story must not require photo IDs.

`PhotoStory` keeps its optional legacy cover ID. The gallery home resolves a
story cover from the photo manifest by matching `storySlug` and `isCover`, with
the legacy frontmatter value taking precedence and the first story-order photo
as a final fallback. The gallery stories plugin no longer requires a `cover`
frontmatter field for a story to be indexed.

## Markdown migration

The current story will move its source images into
`gallery-staging/2026-05-06/`, retaining their bytes so content-hash IDs do not
change. Its `order.json` will preserve the current editorial order, including
placing `cover.jpg` in the middle. Its page will remove the manual `cover` ID
and photo ID list and use:

```vue
<StoryAlbum story="2026-05-06" />
```

Existing path-based image metadata remains supported. Inline caption overrides
will remain available for exceptional presentation needs; ordinary captions
can be moved to staging metadata so they are attached to manifest records.

## Validation and failure handling

- The gallery build fails clearly when a story directory contains no supported
  images.
- An `order.json` with a missing, duplicate, or unknown image path fails with a
  clear validation error.
- A missing explicit `cover.*` produces a deterministic fallback cover rather
  than an empty gallery card.
- Unknown or stale story IDs render no broken image entries because album
  filtering operates on manifest records.
- Existing hash, derivative, manifest, story plugin, and album tests are
  updated to cover directory grouping, ordering, cover resolution, and the
  no-photo-ID Markdown interface.

## Acceptance criteria

1. `gallery-staging/2026-05-06/` builds all contained images into both required
   derivative formats.
2. `photos.json` associates every image with `2026-05-06` and a stable order.
3. The gallery home resolves its card cover from `cover.jpg` automatically.
4. The story page displays every image with only `story="2026-05-06"`.
5. `npm run gallery:test`, `npm test`, and `npm run docs:build` pass.
