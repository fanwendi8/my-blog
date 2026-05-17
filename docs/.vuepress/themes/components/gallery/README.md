# Gallery 图库组件说明

本目录包含摄影故事页面的布局组件，用于在 Markdown 中排版照片。所有组件均通过 VuePress 的客户端组件自动注册，在 Markdown 中可直接使用标签名调用。

---

## 前置要求

摄影故事 Markdown 文件需满足以下条件：

1. **Frontmatter** 中至少包含 `title` 和 `pageClass: photo-story-page`
2. **照片数据** 通过 `useGalleryData()` 注入，照片 ID 对应 `docs/.vuepress/public/gallery/data/photos.json` 中的条目
3. 组件读取的 frontmatter 字段：`title`、`date`、`location`

示例 frontmatter：

```yaml
---
title: 摄影故事标题
date: 2025-01-02
location: Beijing
permalink: /gallery/story-slug/
pageClass: photo-story-page
---
```

---

## 组件一览

### `<PhotoStoryHeader />`

自动渲染故事头部，包括标题、格式化日期和地点。无需任何 props，数据全部来自页面 frontmatter。

```markdown
<PhotoStoryHeader />
```

---

### `<StoryPhoto />`

单张照片，独立成行，下方可带说明文字。

| Prop      | 类型     | 必填 | 说明                             |
| --------- | -------- | ---- | -------------------------------- |
| `id`      | `string` | 是   | 照片 ID，对应 gallery data 中的 `id` |
| `caption` | `string` | 否   | 图片说明，如不传则使用照片的默认 caption |

```markdown
<StoryPhoto id="86d69bbb5878" caption="北京。2025。" />
```

---

### `<StoryPhotos />`

多张照片横向平铺排列，支持自动均分宽度。

| Prop      | 类型       | 必填 | 说明                             |
| --------- | ---------- | ---- | -------------------------------- |
| `:ids`    | `string[]` | 是   | 照片 ID 数组                      |
| `caption` | `string`   | 否   | 整组图片的说明文字                 |

```markdown
<StoryPhotos
  :ids="['53790f2ce74b', 'afb0b234ec65']"
  caption="两张并排：同一地点的两个观察角度。"
/>
```

---

### `<StorySplit />`

最灵活的分栏布局组件，支持左右分栏、上下分栏、主次交换。

| Prop       | 类型       | 必填 | 默认值   | 说明                             |
| ---------- | ---------- | ---- | -------- | -------------------------------- |
| `:left`    | `string[]` | 是   | —        | 左侧（或上方）照片 ID 数组          |
| `:right`   | `string[]` | 是   | —        | 右侧（或下方）照片 ID 数组          |
| `reverse`  | `boolean`  | 否   | `false`  | 交换主次区域（视觉主图放右侧）       |
| `vertical` | `boolean`  | 否   | `false`  | 改为上下分栏（上为主、下为次）       |
| `caption`  | `string`   | 否   | —        | 整组图片的说明文字                  |

**左右分栏（默认）：**

```markdown
<StorySplit
  :left="['86d69bbb5878']"
  :right="['53790f2ce74b', 'afb0b234ec65']"
  caption="1 左 2 右。"
/>
```

**左右分栏 + reverse（主图在右）：**

```markdown
<StorySplit
  :left="['53790f2ce74b', 'afb0b234ec65']"
  :right="['86d69bbb5878']"
  reverse
  caption="2 左 1 右，主图在右侧。"
/>
```

**上下分栏（vertical）：**

```markdown
<StorySplit
  :left="['afb0b234ec65']"
  :right="['86d69bbb5878', '53790f2ce74b']"
  vertical
  caption="上 1 下 2，更像段落中的版面停顿。"
/>
```

---

## 完整故事页面示例

```markdown
---
title: Example Layout Story
date: 2025-01-02
location: Beijing
cover: afb0b234ec65
permalink: /gallery/example-layout-story/
pageClass: photo-story-page
---

<PhotoStoryHeader />

这是一篇用来测试摄影故事排版的页面。让照片跟文字一起出现在叙事节奏里。

<StoryPhoto id="86d69bbb5878" caption="北京。2025。" />

单张照片适合放在段落之后，像一个停顿。这里继续写普通 Markdown。

<StoryPhotos
  :ids="['53790f2ce74b', 'afb0b234ec65']"
  caption="两张并排：同一地点的两个观察角度。"
/>

两张图可以并排组成一个小节奏。

<StorySplit
  :left="['53790f2ce74b']"
  :right="['86d69bbb5878', 'afb0b234ec65']"
  caption="左一右二：主图与两个补充视角。"
/>

下面继续写 Markdown。

<StorySplit
  :left="['53790f2ce74b']"
  :right="['86d69bbb5878', 'afb0b234ec65', '53790f2ce74b']"
  vertical
  caption="上 1 下 3，底部三张横向排列。"
/>
```

---

## 组件关系

```
PhotoStoryHeader       ── 读取 frontmatter，渲染头部
StoryPhoto             ── 包裹 PhotoStoryImage(mode=single)
StoryPhotos            ── 包裹 PhotoStoryImage(mode=tile) × N
StorySplit             ── 包裹 PhotoStoryImage(mode=tile) × N
PhotoStoryImage        ── 底层组件：查 gallery data，渲染 <img> + <figcaption>
```
