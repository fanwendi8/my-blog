# Blog Gallery Style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the confirmed light, airy visual style to the blog and Gallery pages without adding new product features.

**Architecture:** Keep VuePress Plume and the existing Gallery data flow intact. Use SCSS overrides for the blog, navbar, Gallery grid, album cards, chips, and lightbox; make only small Vue template additions where existing markup does not expose the information layer needed by the style.

**Tech Stack:** VuePress 2, vuepress-theme-plume, Vue 3 SFCs, SCSS, PhotoSwipe, justified-layout, virtua.

---

## File Structure

- Modify `docs/.vuepress/themes/styles/_navbar.scss`: global navbar glass treatment and menu/search polish.
- Modify `docs/.vuepress/themes/styles/_blog.scss`: blog list background, post card, metadata, pagination, tags, and responsive polish.
- Modify `docs/.vuepress/themes/styles/_gallery.scss`: Gallery background, header, tabs, grid tiles, album cards, chips, lightbox, info panel, dark/mobile variants.
- Modify `docs/.vuepress/themes/layouts/GalleryHome.vue`: add a decorative star span and classed count text in the existing header.
- Modify `docs/.vuepress/themes/components/gallery/PhotoTile.vue`: add readonly image metadata overlay; no new events or state.
- Modify `docs/.vuepress/themes/components/gallery/TabAlbums.vue`: expose album title, description/count, and arrow overlay on cover cards.
- Modify `docs/.vuepress/themes/components/gallery/PhotoInfoPanel.vue`: add semantic wrappers for visual sections while preserving current data fields.

## Task 1: Navbar And Shared Light Surface

**Files:**
- Modify: `docs/.vuepress/themes/styles/_navbar.scss`

- [ ] **Step 1: Replace navbar styles**

Replace the contents of `docs/.vuepress/themes/styles/_navbar.scss` with:

```scss
.vp-navbar {
  --nav-surface: rgba(255, 255, 255, .78);
  --nav-border: rgba(144, 151, 168, .18);

  border-bottom: 1px solid var(--nav-border);
  background: var(--nav-surface);
  box-shadow: 0 10px 32px rgba(28, 36, 58, .05);
  backdrop-filter: saturate(180%) blur(18px);

  .navbar-menu-link {
    border-radius: 999px;
    padding: 8px 12px;
    font-family: "ZWZT";
    font-size: 16px;
    transition:
      background-color .18s ease,
      color .18s ease,
      box-shadow .18s ease;
  }

  .navbar-menu-link:hover,
  .navbar-menu-link.active {
    background: rgba(255, 255, 255, .9);
    box-shadow: 0 8px 24px rgba(126, 87, 255, .09);
    color: #ec7f22;
  }
}

@media (max-width: 768px) {
  .vp-navbar {
    box-shadow: 0 8px 24px rgba(28, 36, 58, .06);
  }
}

[data-theme="dark"] .vp-navbar {
  --nav-surface: rgba(27, 27, 31, .82);
  --nav-border: rgba(255, 255, 255, .08);
  box-shadow: 0 10px 32px rgba(0, 0, 0, .24);
}
```

- [ ] **Step 2: Build-check SCSS selectors**

Run: `npm run docs:build`

Expected: build completes; if a Plume selector is absent, Sass still compiles because all selectors are plain CSS.

- [ ] **Step 3: Commit**

Run:

```bash
git add docs/.vuepress/themes/styles/_navbar.scss
git commit -m "style: polish navbar surface"
```

## Task 2: Blog Light Card Styling

**Files:**
- Modify: `docs/.vuepress/themes/styles/_blog.scss`

- [ ] **Step 1: Replace blog styles**

Replace the contents of `docs/.vuepress/themes/styles/_blog.scss` with:

```scss
.vp-doc-container.is-posts {
  min-height: calc(100vh - var(--vp-nav-height, 64px));
  background:
    radial-gradient(circle at 18% 10%, rgba(255, 166, 77, .13), transparent 28rem),
    radial-gradient(circle at 82% 6%, rgba(138, 103, 255, .12), transparent 30rem),
    linear-gradient(180deg, #fbfcff 0%, #fff 42%, #fbfbfd 100%);
}

.vp-doc-container.is-posts .vp-doc {
  max-width: 1120px;
}

.vp-posts-nav {
  display: none;
}

.vp-post-list,
.vp-blog-post-list {
  display: grid;
  gap: 18px;
}

.vp-post-item,
.vp-blog-post-item,
.vp-post,
.vp-article-item {
  border: 1px solid rgba(143, 151, 170, .16);
  border-radius: 14px;
  background: rgba(255, 255, 255, .82);
  box-shadow: 0 18px 48px rgba(31, 39, 60, .06);
  backdrop-filter: blur(14px);
  transition:
    transform .18s ease,
    border-color .18s ease,
    box-shadow .18s ease;
}

.vp-post-item:hover,
.vp-blog-post-item:hover,
.vp-post:hover,
.vp-article-item:hover {
  border-color: rgba(138, 103, 255, .22);
  box-shadow: 0 22px 60px rgba(31, 39, 60, .09);
  transform: translateY(-2px);
}

.vp-post-item a,
.vp-blog-post-item a,
.vp-post a,
.vp-article-item a {
  text-decoration: none;
}

.vp-post-item h2,
.vp-blog-post-item h2,
.vp-post h2,
.vp-article-item h2 {
  letter-spacing: 0;
}

.vp-post-meta,
.vp-blog-post-meta,
.vp-article-meta,
.vp-post-tags,
.vp-blog-tags {
  color: rgba(60, 60, 67, .62);
}

.vp-post-tags a,
.vp-blog-tags a,
.vp-tag,
.vp-article-tag {
  border: 1px solid rgba(138, 103, 255, .16);
  border-radius: 999px;
  background: rgba(255, 255, 255, .74);
  color: rgba(60, 60, 67, .72);
}

.vp-pagination,
.vp-posts-pagination {
  margin-top: 28px;
}

@media (max-width: 768px) {
  .vp-doc-container.is-posts .vp-doc {
    padding-inline: 18px;
  }

  .vp-post-item,
  .vp-blog-post-item,
  .vp-post,
  .vp-article-item {
    border-radius: 12px;
  }
}

[data-theme="dark"] .vp-doc-container.is-posts {
  background:
    radial-gradient(circle at 18% 10%, rgba(236, 127, 34, .1), transparent 28rem),
    radial-gradient(circle at 82% 6%, rgba(138, 103, 255, .11), transparent 30rem),
    linear-gradient(180deg, #1b1b1f 0%, #161618 100%);
}

[data-theme="dark"] .vp-post-item,
[data-theme="dark"] .vp-blog-post-item,
[data-theme="dark"] .vp-post,
[data-theme="dark"] .vp-article-item {
  border-color: rgba(255, 255, 255, .08);
  background: rgba(32, 33, 39, .78);
  box-shadow: 0 18px 48px rgba(0, 0, 0, .2);
}
```

- [ ] **Step 2: Verify blog routes build**

Run: `npm run docs:build`

Expected: build completes and generated output includes `docs/.vuepress/dist/blog/archives/index.html` and `docs/.vuepress/dist/blog/tags/index.html`.

- [ ] **Step 3: Commit**

Run:

```bash
git add docs/.vuepress/themes/styles/_blog.scss
git commit -m "style: refresh blog cards"
```

## Task 3: Gallery Header And Tabs

**Files:**
- Modify: `docs/.vuepress/themes/layouts/GalleryHome.vue`
- Modify: `docs/.vuepress/themes/styles/_gallery.scss`

- [ ] **Step 1: Update Gallery header markup**

In `docs/.vuepress/themes/layouts/GalleryHome.vue`, replace the header block with:

```vue
<header class="gallery-home__header">
  <div>
    <h1>瞳画 <span aria-hidden="true">✦</span></h1>
    <p class="gallery-home__sub">{{ photos.length }} 件作品</p>
  </div>
</header>
```

- [ ] **Step 2: Replace Gallery base and tabs styles**

In `docs/.vuepress/themes/styles/_gallery.scss`, replace the `.gallery-home`, `.gallery-home__header`, `.gallery-home__header h1`, `.gallery-home__sub`, `.gallery-loading`, `.gallery-empty`, `.gallery-error`, `.gallery-btn`, `.gallery-tabs`, and `.gallery-tab` rules with:

```scss
.gallery-home {
  max-width: 1440px;
  margin: 0 auto;
  padding: 36px 24px 72px;
  background:
    radial-gradient(circle at 16% 0%, rgba(255, 166, 77, .14), transparent 30rem),
    radial-gradient(circle at 84% 2%, rgba(138, 103, 255, .12), transparent 32rem);
}

.gallery-home__header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 24px;
}

.gallery-home__header h1 {
  margin: 0 0 6px;
  color: #202638;
  font-size: 36px;
  line-height: 1.15;
  letter-spacing: 0;
}

.gallery-home__header h1 span {
  color: #8a67ff;
  font-size: .58em;
  vertical-align: top;
}

.gallery-home__sub {
  color: rgba(60, 60, 67, .68);
  font-size: 15px;
}

.gallery-loading,
.gallery-empty {
  padding: 72px 24px;
  color: var(--vp-c-text-2);
  text-align: center;
}

.gallery-error {
  border: 1px dashed rgba(236, 127, 34, .32);
  border-radius: 12px;
  padding: 24px;
  background: rgba(255, 255, 255, .76);
}

.gallery-btn {
  margin-top: 8px;
  border: 1px solid rgba(143, 151, 170, .22);
  border-radius: 999px;
  padding: 7px 16px;
  background: rgba(255, 255, 255, .82);
  cursor: pointer;
}

.gallery-tabs {
  display: inline-grid;
  grid-template-columns: repeat(3, minmax(96px, 1fr));
  gap: 0;
  min-width: min(100%, 360px);
  margin-bottom: 22px;
  overflow: hidden;
  border: 1px solid rgba(143, 151, 170, .2);
  border-radius: 12px;
  background: rgba(255, 255, 255, .72);
  box-shadow: 0 12px 32px rgba(31, 39, 60, .05);
  backdrop-filter: blur(14px);
}

.gallery-tab {
  position: relative;
  border: 0;
  border-radius: 0;
  padding: 10px 18px;
  background: transparent;
  color: rgba(60, 60, 67, .66);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: color .18s ease, background-color .18s ease;
}

.gallery-tab + .gallery-tab {
  border-left: 1px solid rgba(143, 151, 170, .14);
}

.gallery-tab:hover {
  color: var(--vp-c-text-1);
}

.gallery-tab.is-active {
  background: rgba(255, 255, 255, .95);
  color: #2a3040;
  box-shadow: inset 0 -2px 0 #9b73ff;
}
```

- [ ] **Step 3: Add mobile Gallery header styles**

Append this media block to `_gallery.scss`:

```scss
@media (max-width: 720px) {
  .gallery-home {
    padding: 28px 16px 56px;
  }

  .gallery-home__header {
    align-items: start;
    flex-direction: column;
  }

  .gallery-home__header h1 {
    font-size: 32px;
  }

  .gallery-tabs {
    width: 100%;
  }
}
```

- [ ] **Step 4: Commit**

Run:

```bash
git add docs/.vuepress/themes/layouts/GalleryHome.vue docs/.vuepress/themes/styles/_gallery.scss
git commit -m "style: refresh gallery header tabs"
```

## Task 4: Gallery Tiles And Album Cards

**Files:**
- Modify: `docs/.vuepress/themes/components/gallery/PhotoTile.vue`
- Modify: `docs/.vuepress/themes/components/gallery/TabAlbums.vue`
- Modify: `docs/.vuepress/themes/styles/_gallery.scss`

- [ ] **Step 1: Add readonly tile overlay**

In `docs/.vuepress/themes/components/gallery/PhotoTile.vue`, add this block after the `img` element and before the error block:

```vue
<div v-if="!errored && (photo.title || photo.tags?.length)" class="photo-tile__meta">
  <span v-if="photo.tags?.[0]" class="photo-tile__tag">{{ photo.tags[0] }}</span>
  <strong v-if="photo.title">{{ photo.title }}</strong>
</div>
```

- [ ] **Step 2: Update album card markup**

In `docs/.vuepress/themes/components/gallery/TabAlbums.vue`, replace the contents of the `.gallery-album-card` button with:

```vue
<div class="gallery-album-card__cover">
  <img v-if="coverSrc(a)" :src="coverSrc(a)" :alt="a.title" loading="lazy" decoding="async" />
  <div class="gallery-album-card__shade"></div>
  <div class="gallery-album-card__meta">
    <h3>{{ a.title }}</h3>
    <p>{{ a.desc || `${a.count} 张` }}</p>
    <span>{{ a.count }} 张</span>
  </div>
  <span class="gallery-album-card__arrow" aria-hidden="true">→</span>
</div>
```

- [ ] **Step 3: Replace tile and album styles**

In `_gallery.scss`, replace the `.justified-grid`, `.justified-grid > div`, `.justified-grid__row`, `.justified-grid__cell`, `.photo-tile`, `.photo-tile img`, `.photo-tile__bh`, `.photo-tile__bh.is-hidden`, `.gallery-album-grid`, `.gallery-album-card`, `.gallery-album-card:hover`, `.gallery-album-card__cover`, `.gallery-album-card__cover img`, `.gallery-album-card__meta`, `.gallery-album-card__meta h3`, and `.gallery-album-card__meta p` rules with:

```scss
.justified-grid {
  width: 100%;
  min-height: 60vh;
}

.justified-grid > div {
  width: 100%;
  border-radius: 12px;
}

.justified-grid__row {
  width: 100%;
}

.justified-grid__cell {
  overflow: hidden;
  border-radius: 10px;
  cursor: zoom-in;
  box-shadow: 0 14px 34px rgba(31, 39, 60, .08);
  transition: transform .18s ease, box-shadow .18s ease;
}

.justified-grid__cell:hover {
  box-shadow: 0 18px 44px rgba(31, 39, 60, .12);
  transform: translateY(-2px);
}

.photo-tile {
  position: relative;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
}

.photo-tile::after {
  position: absolute;
  inset: auto 0 0;
  height: 48%;
  pointer-events: none;
  content: "";
  background: linear-gradient(180deg, transparent, rgba(10, 14, 24, .58));
  opacity: .88;
}

.photo-tile img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .35s ease;
}

.justified-grid__cell:hover .photo-tile img {
  transform: scale(1.025);
}

.photo-tile__bh {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transition: opacity .3s;
}

.photo-tile__bh.is-hidden {
  opacity: 0;
  pointer-events: none;
}

.photo-tile__meta {
  position: absolute;
  right: 14px;
  bottom: 12px;
  left: 14px;
  z-index: 1;
  display: grid;
  gap: 4px;
  color: #fff;
  text-shadow: 0 1px 12px rgba(0, 0, 0, .35);
}

.photo-tile__meta strong {
  overflow: hidden;
  font-size: 15px;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.photo-tile__tag {
  width: fit-content;
  border: 1px solid rgba(255, 255, 255, .26);
  border-radius: 999px;
  padding: 2px 8px;
  background: rgba(255, 255, 255, .16);
  font-size: 12px;
}

.gallery-album-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.gallery-album-card {
  display: block;
  overflow: hidden;
  border: 0;
  border-radius: 12px;
  padding: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
  box-shadow: 0 16px 38px rgba(31, 39, 60, .1);
  transition: transform .18s ease, box-shadow .18s ease;
}

.gallery-album-card:hover {
  box-shadow: 0 22px 56px rgba(31, 39, 60, .14);
  transform: translateY(-3px);
}

.gallery-album-card__cover {
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: var(--vp-c-bg-mute);
}

.gallery-album-card__cover img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .35s ease;
}

.gallery-album-card:hover .gallery-album-card__cover img {
  transform: scale(1.035);
}

.gallery-album-card__shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 30%, rgba(9, 14, 24, .72));
}

.gallery-album-card__meta {
  position: absolute;
  right: 16px;
  bottom: 16px;
  left: 16px;
  z-index: 1;
  color: #fff;
}

.gallery-album-card__meta h3 {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0;
}

.gallery-album-card__meta p {
  margin: 0 0 10px;
  color: rgba(255, 255, 255, .82);
  font-size: 13px;
}

.gallery-album-card__meta span {
  font-size: 13px;
}

.gallery-album-card__arrow {
  position: absolute;
  right: 14px;
  bottom: 14px;
  z-index: 2;
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, .45);
  border-radius: 50%;
  color: #fff;
}
```

- [ ] **Step 4: Run component tests**

Run: `npx vitest run docs/.vuepress/themes/__tests__/PhotoTile.test.ts docs/.vuepress/themes/__tests__/TabAlbums.test.ts`

Expected: existing tests pass because required class names and click behavior remain.

- [ ] **Step 5: Commit**

Run:

```bash
git add docs/.vuepress/themes/components/gallery/PhotoTile.vue docs/.vuepress/themes/components/gallery/TabAlbums.vue docs/.vuepress/themes/styles/_gallery.scss
git commit -m "style: refine gallery cards"
```

## Task 5: Gallery Chips And Lightbox Info Panel

**Files:**
- Modify: `docs/.vuepress/themes/components/gallery/PhotoInfoPanel.vue`
- Modify: `docs/.vuepress/themes/styles/_gallery.scss`

- [ ] **Step 1: Wrap info panel sections**

In `docs/.vuepress/themes/components/gallery/PhotoInfoPanel.vue`, replace the template with:

```vue
<template>
  <aside class="gallery-info">
    <header class="gallery-info__head">
      <h3 v-if="photo.title">{{ photo.title }}</h3>
      <time class="gallery-info__time">{{ taken }}</time>
    </header>

    <p v-if="photo.desc" class="gallery-info__desc">{{ photo.desc }}</p>

    <section v-if="photo.exif" class="gallery-info__section">
      <dl class="gallery-info__exif">
        <template v-if="photo.exif.camera"><dt>相机</dt><dd>{{ photo.exif.camera }}</dd></template>
        <template v-if="photo.exif.lens"><dt>镜头</dt><dd>{{ photo.exif.lens }}</dd></template>
        <template v-if="photo.exif.fl != null"><dt>焦距</dt><dd>{{ photo.exif.fl }}mm</dd></template>
        <template v-if="photo.exif.fn != null"><dt>光圈</dt><dd>f/{{ photo.exif.fn }}</dd></template>
        <template v-if="photo.exif.iso != null"><dt>ISO</dt><dd>ISO {{ photo.exif.iso }}</dd></template>
        <template v-if="photo.exif.exp"><dt>快门</dt><dd>{{ photo.exif.exp }}</dd></template>
      </dl>
    </section>

    <div v-if="photo.tags?.length" class="gallery-info__tags">
      <span v-for="t in photo.tags" :key="t" class="gallery-info__tag">{{ t }}</span>
    </div>

    <a v-if="gpsHref" :href="gpsHref" class="gallery-info__gps" target="_blank" rel="noopener">
      在地图打开 <span aria-hidden="true">↗</span>
    </a>
  </aside>
</template>
```

- [ ] **Step 2: Replace chips and lightbox styles**

In `_gallery.scss`, replace the `.gallery-lightbox`, `.gallery-lightbox__stage`, `.gallery-lightbox__stage .pswp`, `.gallery-lightbox__panel`, `.gallery-lightbox__panel .gallery-info`, `.gallery-info`, `.gallery-info__head h3`, `.gallery-info__time`, `.gallery-info__desc`, `.gallery-info__exif`, `.gallery-info__exif dt`, `.gallery-info__exif dd`, `.gallery-info__tags`, `.gallery-info__tag`, `.gallery-info__gps`, `.gallery-info__gps:hover`, `.gallery-chips`, `.gallery-chip`, `.gallery-chip:hover`, `.gallery-chip.is-active`, and `.gallery-chip__count` rules with:

```scss
.gallery-lightbox {
  position: fixed;
  z-index: 100000;
  inset: 0;
  display: flex;
  gap: 0;
  padding: 28px;
  background:
    radial-gradient(circle at 15% 0%, rgba(255, 166, 77, .13), transparent 28rem),
    radial-gradient(circle at 88% 10%, rgba(138, 103, 255, .14), transparent 30rem),
    rgba(246, 247, 251, .96);
}

.gallery-lightbox__stage {
  position: relative;
  isolation: isolate;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  border-radius: 18px 0 0 18px;
  background: #10131c;
  box-shadow: 0 24px 70px rgba(20, 26, 42, .18);
}

.gallery-lightbox__stage .pswp {
  position: absolute !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
}

.gallery-lightbox__panel {
  position: relative;
  flex-shrink: 0;
  width: 360px;
  border-left: 1px solid rgba(143, 151, 170, .18);
  border-radius: 0 18px 18px 0;
  background: rgba(255, 255, 255, .9);
  box-shadow: 0 24px 70px rgba(20, 26, 42, .13);
  backdrop-filter: blur(18px);
}

.gallery-lightbox__panel .gallery-info {
  position: static;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
}

.gallery-info {
  overflow-y: auto;
  padding: 32px;
  color: #202638;
}

.gallery-info__head {
  padding-bottom: 22px;
}

.gallery-info__head h3 {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.2;
}

.gallery-info__time {
  color: rgba(60, 60, 67, .62);
  font-size: 14px;
}

.gallery-info__desc {
  margin: 0 0 24px;
  color: rgba(32, 38, 56, .86);
  line-height: 1.7;
  font-size: 15px;
}

.gallery-info__section {
  border-block: 1px solid rgba(143, 151, 170, .18);
  padding: 22px 0;
}

.gallery-info__exif {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 14px 18px;
  margin: 0;
  font-size: 15px;
}

.gallery-info__exif dt {
  margin: 0;
  color: rgba(60, 60, 67, .58);
}

.gallery-info__exif dd {
  margin: 0;
  color: #202638;
  font-weight: 600;
}

.gallery-info__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 22px 0;
}

.gallery-info__tag {
  border-radius: 999px;
  padding: 8px 16px;
  background: rgba(138, 103, 255, .1);
  color: #6f55d9;
  font-size: 14px;
}

.gallery-info__gps {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24px;
  border-radius: 12px;
  padding: 14px 16px;
  background: rgba(138, 103, 255, .08);
  color: #6f55d9;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
}

.gallery-info__gps:hover {
  background: rgba(138, 103, 255, .13);
  text-decoration: none;
}

.gallery-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 22px;
}

.gallery-chip {
  border: 1px solid rgba(143, 151, 170, .2);
  border-radius: 999px;
  padding: 8px 15px;
  background: rgba(255, 255, 255, .74);
  color: rgba(60, 60, 67, .68);
  cursor: pointer;
  font-size: 13px;
  transition: background .15s, border-color .15s, color .15s, box-shadow .15s;
}

.gallery-chip:hover {
  border-color: rgba(138, 103, 255, .32);
  color: var(--vp-c-text-1);
}

.gallery-chip.is-active {
  border-color: rgba(138, 103, 255, .32);
  background: rgba(138, 103, 255, .1);
  box-shadow: 0 8px 24px rgba(138, 103, 255, .1);
  color: #6f55d9;
}

.gallery-chip__count {
  margin-left: 6px;
  opacity: .7;
  font-size: 11px;
}
```

- [ ] **Step 3: Replace mobile lightbox styles**

Replace the existing `@media (max-width: 720px)` lightbox block with:

```scss
@media (max-width: 720px) {
  .gallery-lightbox {
    flex-direction: column;
    padding: 12px;
  }

  .gallery-lightbox__stage {
    min-height: 55vh;
    border-radius: 14px 14px 0 0;
  }

  .gallery-lightbox__panel {
    width: 100%;
    max-height: 40vh;
    border-left: 0;
    border-top: 1px solid rgba(143, 151, 170, .18);
    border-radius: 0 0 14px 14px;
  }

  .gallery-info {
    max-height: 40vh;
    padding: 22px;
  }

  .gallery-info__head h3 {
    font-size: 22px;
  }
}
```

- [ ] **Step 4: Run info panel and lightbox tests**

Run: `npx vitest run docs/.vuepress/themes/__tests__/PhotoInfoPanel.test.ts docs/.vuepress/themes/__tests__/Lightbox.test.ts`

Expected: tests pass because `.gallery-info__tag`, `.gallery-info__exif`, `.gallery-info__gps`, `.gallery-lightbox`, and `.gallery-lightbox__panel` remain.

- [ ] **Step 5: Commit**

Run:

```bash
git add docs/.vuepress/themes/components/gallery/PhotoInfoPanel.vue docs/.vuepress/themes/styles/_gallery.scss
git commit -m "style: brighten gallery lightbox"
```

## Task 6: Final Build And Visual Verification

**Files:**
- Modify only if verification finds a concrete style regression in files from Tasks 1-5.

- [ ] **Step 1: Run full tests**

Run: `npm run test`

Expected: all Vitest suites pass.

- [ ] **Step 2: Build docs**

Run: `npm run docs:build`

Expected: VuePress build succeeds and outputs `/blog/`, `/blog/tags/`, `/blog/archives/`, and `/gallery/`.

- [ ] **Step 3: Start dev server**

Run: `npm run docs:dev -- --host 127.0.0.1`

Expected: VuePress prints a local URL, normally `http://127.0.0.1:8080/`.

- [ ] **Step 4: Inspect desktop routes**

Use Playwright or a browser to inspect:

- `/blog/`
- `/blog/tags/`
- `/blog/archives/`
- `/gallery/`
- `/gallery/#tab=albums`
- `/gallery/#tab=tags`

Expected: no overlap, no horizontal overflow, tabs and chips wrap cleanly, Gallery images remain visible.

- [ ] **Step 5: Inspect mobile Gallery and Lightbox**

Use a 390px wide viewport. Open `/gallery/`, click a photo, then navigate and close.

Expected: lightbox opens, image stage is visible, info panel is scrollable, close/reopen still works.

- [ ] **Step 6: Commit verification fixes if needed**

If style fixes were required, run:

```bash
git add docs/.vuepress/themes/styles/_navbar.scss docs/.vuepress/themes/styles/_blog.scss docs/.vuepress/themes/styles/_gallery.scss docs/.vuepress/themes/layouts/GalleryHome.vue docs/.vuepress/themes/components/gallery/PhotoTile.vue docs/.vuepress/themes/components/gallery/TabAlbums.vue docs/.vuepress/themes/components/gallery/PhotoInfoPanel.vue
git commit -m "style: finalize blog gallery polish"
```

If no fixes were required, do not create an empty commit.

## Self-Review

- Spec coverage: navbar, blog page, Gallery header/tabs, tiles, albums, chips, lightbox, responsive behavior, and no-new-feature constraints are each covered by Tasks 1-6.
- Placeholder scan: no unresolved placeholder steps remain.
- Type consistency: existing Vue props and fields are reused (`photo.title`, `photo.tags`, `photo.exif`, `album.title`, `album.desc`, `album.count`); no new data contract is introduced.
