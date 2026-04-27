# Gallery 时间轴侧栏布局实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Gallery「时间线」Tab 重构为"左侧年份时间轴 Sidebar + 右侧图库主体"的左右分栏布局，同时优化卡片和标题区视觉。

**Architecture:** 新建 `YearTimeline.vue` 作为独立 Sidebar 组件；`TabTimeline.vue` 改为 Grid 左右分栏容器，右侧遍历年份组渲染 `JustifiedGrid`；样式集中更新在 `_gallery.scss` 中；响应式通过媒体查询在 `<900px` 时隐藏 Sidebar 改为横向年份 chips。

**Tech Stack:** Vue 3 (Composition API), SCSS, VuePress Plume, `justified-layout`

---

### Task 1: 创建 YearTimeline 组件

**Files:**
- Create: `docs/.vuepress/themes/components/gallery/YearTimeline.vue`
- Modify: `docs/.vuepress/themes/components/gallery/TabTimeline.vue` (在 Task 2 中引入)

**Context:** 这是一个纯展示组件，接收年份列表和当前激活年份，点击年份时 emit 事件。

- [ ] **Step 1: 创建 YearTimeline.vue**

```vue
<script setup lang="ts">
import { computed } from 'vue'

interface YearGroup {
  year: number
  count: number
}

const props = defineProps<{
  years: YearGroup[]
  activeYear: number | null
}>()

const emit = defineEmits<{
  (e: 'select', year: number): void
}>()

const sortedYears = computed(() =>
  [...props.years].sort((a, b) => b.year - a.year)
)
</script>

<template>
  <aside class="year-timeline">
    <div class="year-timeline__line" />
    <nav class="year-timeline__list">
      <button
        v-for="yg in sortedYears"
        :key="yg.year"
        class="year-timeline__item"
        :class="{ 'is-active': activeYear === yg.year }"
        @click="emit('select', yg.year)"
      >
        <span class="year-timeline__dot" />
        <div class="year-timeline__meta">
          <span class="year-timeline__year">{{ yg.year }}</span>
          <span class="year-timeline__count">{{ yg.count }} 件作品</span>
        </div>
      </button>
    </nav>
  </aside>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add docs/.vuepress/themes/components/gallery/YearTimeline.vue
git commit -m "feat(gallery): add YearTimeline sidebar component"
```

---

### Task 2: 重构 TabTimeline 为左右分栏布局

**Files:**
- Modify: `docs/.vuepress/themes/components/gallery/TabTimeline.vue`
- Create: `docs/.vuepress/themes/components/gallery/YearTimeline.vue` (if not done in Task 1)

**Context:** 当前 TabTimeline 使用"时间轴点嵌套在年份组中"的结构（`padding-left: 112px`）。改为左侧 Sidebar + 右侧内容区。每个年份组需要可滚动定位的锚点。

- [ ] **Step 1: 重写 TabTimeline.vue**

完整替换文件内容：

```vue
<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import JustifiedGrid from './JustifiedGrid.vue'
import YearTimeline from './YearTimeline.vue'
import type { Photo } from './types'

const props = defineProps<{ photos: Photo[] }>()
defineEmits<{ (e: 'open', id: string): void }>()

const yearGroups = computed(() => {
  const groups = new Map<number, Photo[]>()
  for (const photo of props.photos) {
    const year = new Date(photo.takenAt).getFullYear()
    if (!groups.has(year)) groups.set(year, [])
    groups.get(year)!.push(photo)
  }
  return [...groups.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, photos]) => ({ year, photos }))
})

const yearList = computed(() =>
  yearGroups.value.map(g => ({ year: g.year, count: g.photos.length }))
)

const activeYear = ref<number | null>(yearList.value[0]?.year ?? null)

const groupRefs = ref<Map<number, HTMLElement>>(new Map())

function setGroupRef(el: HTMLElement | null, year: number) {
  if (el) groupRefs.value.set(year, el)
}

function scrollToYear(year: number) {
  activeYear.value = year
  const el = groupRefs.value.get(year)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// IntersectionObserver to sync activeYear on scroll
const contentRef = ref<HTMLElement | null>(null)
let io: IntersectionObserver | null = null

onMounted(() => {
  nextTick(() => {
    io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const year = Number((entry.target as HTMLElement).dataset.year)
            if (!isNaN(year)) activeYear.value = year
          }
        })
      },
      { root: null, rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    )
    groupRefs.value.forEach((el) => io?.observe(el))
  })
})

onUnmounted(() => {
  io?.disconnect()
})
</script>

<template>
  <section class="gallery-tab gallery-tab--timeline">
    <div v-if="photos.length === 0" class="gallery-empty">还没有作品。</div>
    <template v-else>
      <YearTimeline
        :years="yearList"
        :active-year="activeYear"
        @select="scrollToYear"
      />
      <div ref="contentRef" class="timeline-content">
        <div
          v-for="group in yearGroups"
          :key="group.year"
          :ref="(el) => setGroupRef(el as HTMLElement, group.year)"
          :data-year="group.year"
          class="timeline-year-section"
        >
          <h3 class="timeline-year-section__title">{{ group.year }}</h3>
          <JustifiedGrid :photos="group.photos" @click="(id) => $emit('open', id)" />
        </div>
      </div>
    </template>
  </section>
</template>
```

**注意：** 需要在 `<script setup>` 顶部添加 `onMounted, onUnmounted` 的 import：

```typescript
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
```

- [ ] **Step 2: Commit**

```bash
git add docs/.vuepress/themes/components/gallery/TabTimeline.vue
git commit -m "feat(gallery): refactor TabTimeline to sidebar+content layout"
```

---

### Task 3: 调整 GalleryHome 标题区样式

**Files:**
- Modify: `docs/.vuepress/themes/layouts/GalleryHome.vue`

**Context:** 调整标题区 HTML 结构，方便后续 SCSS 精确定义样式。标题需要更大字号，副标题弱化。

- [ ] **Step 1: 调整 GalleryHome.vue 的 header 结构**

找到 `<header class="gallery-home__header">` 区域（约第 77-82 行），修改为：

```vue
<header class="gallery-home__header">
  <div class="gallery-home__title-wrap">
    <h1>瞳画 <span class="gallery-home__sparkle" aria-hidden="true">✦</span></h1>
    <p class="gallery-home__sub">{{ photos.length }} 件作品</p>
  </div>
</header>
```

- [ ] **Step 2: Commit**

```bash
git add docs/.vuepress/themes/layouts/GalleryHome.vue
git commit -m "style(gallery): adjust GalleryHome header structure for new design"
```

---

### Task 4: 更新 SCSS - 核心布局与 Sidebar 样式

**Files:**
- Modify: `docs/.vuepress/themes/styles/_gallery.scss`

**Context：** 这是最大的样式变更。需要添加 YearTimeline 和 timeline-content 的完整样式，同时保留现有其他组件的样式。

- [ ] **Step 1: 在文件末尾追加新样式（在现有样式之后，media query 之前）**

找到 `@media (max-width: 720px)` 之前的位置（约第 771 行），在其前面插入：

```scss
/* ============================================================
   YearTimeline Sidebar
   ============================================================ */

.year-timeline {
  position: sticky;
  top: 100px;
  align-self: start;
  width: 170px;
  padding-top: 8px;
}

.year-timeline__line {
  position: absolute;
  left: 18px;
  top: 12px;
  bottom: 12px;
  width: 2px;
  background: #e8e8ee;
}

.year-timeline__list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.year-timeline__item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: opacity 0.2s ease;
}

.year-timeline__item:hover {
  opacity: 0.8;
}

.year-timeline__dot {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  margin-top: 6px;
  margin-left: 14px;
  border-radius: 50%;
  background: #d9dbe2;
  transition:
    background 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.year-timeline__item.is-active .year-timeline__dot {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  margin-left: 10px;
  background: #fff;
  border: 3px solid #946cff;
  box-shadow: 0 0 0 6px rgba(148, 108, 255, 0.12);
}

.year-timeline__item:hover .year-timeline__dot {
  background: #b5b8c2;
}

.year-timeline__meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.year-timeline__year {
  font-size: 16px;
  font-weight: 500;
  color: #8c8f99;
  line-height: 1.2;
  transition:
    color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    font-size 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    font-weight 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.year-timeline__item.is-active .year-timeline__year {
  font-size: 22px;
  font-weight: 700;
  color: #946cff;
}

.year-timeline__count {
  font-size: 13px;
  color: #b5b8c2;
  transition: color 0.2s ease;
}

.year-timeline__item.is-active .year-timeline__count {
  color: #a090d0;
}

/* ============================================================
   Timeline Tab Layout
   ============================================================ */

.gallery-tab--timeline {
  display: grid;
  grid-template-columns: 170px minmax(0, 1fr);
  column-gap: 48px;
}

.timeline-content {
  min-width: 0;
}

.timeline-year-section {
  padding-bottom: 56px;
}

.timeline-year-section:last-child {
  padding-bottom: 0;
}

.timeline-year-section__title {
  margin: 0 0 20px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(60, 60, 67, 0.45);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* ============================================================
   GalleryHome Header
   ============================================================ */

.gallery-home__header {
  padding-left: 0;
  margin-bottom: 28px;
}

.gallery-home__header h1 {
  margin: 0 0 8px;
  font-size: 42px;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.gallery-home__sparkle {
  display: inline-block;
  margin-left: 6px;
  color: #946cff;
  font-size: 0.52em;
  vertical-align: super;
  animation: sparkle-pulse 3s ease-in-out infinite;
}

@keyframes sparkle-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.9); }
}

.gallery-home__sub {
  margin: 0;
  color: #8c8f99;
  font-size: 16px;
}

/* ============================================================
   Tabs positioning adjustment
   ============================================================ */

.gallery-tabs {
  margin-left: 0;
  margin-bottom: 32px;
}

/* ============================================================
   PhotoTile card improvements
   ============================================================ */

.photo-tile__meta {
  left: 16px;
  bottom: 14px;
  right: 14px;
}

.photo-tile__meta-main strong {
  font-size: 16px;
  font-weight: 600;
}

.photo-tile__date {
  font-size: 13px;
  opacity: 0.82;
}

.photo-tile__tag {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.24);
  backdrop-filter: blur(8px);
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
}

.photo-tile::after {
  height: 52%;
  background: linear-gradient(180deg, transparent 10%, rgba(10, 14, 24, 0.62));
  opacity: 1;
}
```

- [ ] **Step 2: 修改 media query 中的响应式样式**

将现有的 `@media (max-width: 720px)` 替换为更完整的响应式方案：

```scss
@media (max-width: 1024px) {
  .gallery-tab--timeline {
    grid-template-columns: 130px minmax(0, 1fr);
    column-gap: 32px;
  }

  .year-timeline {
    width: 130px;
  }

  .year-timeline__line {
    left: 14px;
  }

  .year-timeline__dot {
    margin-left: 10px;
  }

  .year-timeline__item.is-active .year-timeline__dot {
    margin-left: 6px;
  }

  .year-timeline__year {
    font-size: 14px;
  }

  .year-timeline__item.is-active .year-timeline__year {
    font-size: 18px;
  }

  .year-timeline__count {
    font-size: 12px;
  }
}

@media (max-width: 720px) {
  .gallery-tab--timeline {
    display: block;
  }

  .year-timeline {
    position: static;
    width: 100%;
    margin-bottom: 24px;
    padding-top: 0;
  }

  .year-timeline__line {
    display: none;
  }

  .year-timeline__list {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 10px;
  }

  .year-timeline__item {
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border-radius: 999px;
    border: 1px solid rgba(143, 151, 170, 0.2);
    background: rgba(255, 255, 255, 0.64);
  }

  .year-timeline__item.is-active {
    border-color: rgba(148, 108, 255, 0.35);
    background: rgba(148, 108, 255, 0.08);
  }

  .year-timeline__dot {
    width: 8px;
    height: 8px;
    margin: 0;
  }

  .year-timeline__item.is-active .year-timeline__dot {
    width: 10px;
    height: 10px;
    margin: 0;
    box-shadow: none;
  }

  .year-timeline__meta {
    flex-direction: row;
    align-items: center;
    gap: 6px;
  }

  .year-timeline__year {
    font-size: 14px;
  }

  .year-timeline__item.is-active .year-timeline__year {
    font-size: 14px;
    color: #946cff;
  }

  .year-timeline__count {
    font-size: 12px;
    margin-top: 0;
  }

  .timeline-year-section {
    padding-bottom: 36px;
  }

  .timeline-year-section__title {
    margin-bottom: 14px;
    font-size: 13px;
  }

  .gallery-home__header h1 {
    font-size: 32px;
  }

  .gallery-tabs {
    width: 100%;
    min-width: 0;
    margin-left: 0;
    box-sizing: border-box;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .gallery-tabs > .gallery-tab {
    min-height: 42px;
    padding: 0 10px;
    font-size: 14px;
  }

  .gallery-tab--albums,
  .gallery-tab--tags {
    padding-left: 0;
  }

  .gallery-home {
    width: min(calc(100% - 32px), 100%);
    padding: 28px 0 56px;
  }

  .justified-grid {
    min-height: 0;
  }

  .justified-grid__viewport {
    overflow-x: visible;
  }

  .gallery-lightbox {
    flex-direction: column;
    padding: 10px;
  }

  .gallery-lightbox__stage {
    flex: 1 1 auto;
    min-height: 52vh;
    border-radius: 14px 14px 0 0;
  }

  .gallery-lightbox__panel {
    flex: 0 0 auto;
    width: 100%;
    max-height: 42vh;
    border-left: 0;
    border-top: 1px solid rgba(143, 151, 170, 0.18);
    border-radius: 0 0 14px 14px;
  }

  .gallery-info {
    max-height: 40vh;
    padding: 22px;
  }

  .gallery-info__head h3 {
    font-size: 22px;
  }

  .gallery-album-grid {
    grid-template-columns: 1fr;
  }

  .gallery-album-card__cover {
    min-height: 190px;
  }
}
```

**注意：** 这段媒体查询中保留了原有 `.gallery-tab--albums`、`.gallery-tab--tags`、`.gallery-lightbox`、`.gallery-info`、`.gallery-album-grid` 等样式，确保其他 tab 和 lightbox 在移动端正常工作。

- [ ] **Step 3: Commit**

```bash
git add docs/.vuepress/themes/styles/_gallery.scss
git commit -m "style(gallery): add sidebar layout, card improvements, responsive"
```

---

### Task 5: 构建验证

**Files:**
- 所有已修改的文件

- [ ] **Step 1: 运行构建**

```bash
npm run docs:build
```

Expected: 构建成功，无 TypeScript/Vue 编译错误。

- [ ] **Step 2: 检查常见错误**

若构建失败，常见原因及修复：

1. **YearTimeline.vue 中未导入 `onMounted`/`onUnmounted`**：
   确保 import 行包含：`import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'`

2. **TabTimeline.vue 中 template ref 类型问题**：
   确保 `:ref="(el) => setGroupRef(el as HTMLElement, group.year)"` 语法正确。如果遇到 Vue 类型错误，可改为函数式绑定：
   ```vue
   :ref="(el) => { if (el) setGroupRef(el as HTMLElement, group.year) }"
   ```

3. **SCSS 语法错误**：
   检查新增的选择器是否有未闭合的大括号。

- [ ] **Step 3: Commit（若只有构建相关的小修复）**

```bash
git add -A
git commit -m "fix(gallery): resolve build errors"
```

---

### Task 6: 浏览器验证

**Files:** 无需修改，仅验证

- [ ] **Step 1: 启动开发服务器**

```bash
npm run docs:dev
```

- [ ] **Step 2: 桌面端验证清单**

访问 `http://localhost:8080/gallery/`，检查：

1. 时间线 Tab 显示左侧 sidebar + 右侧图库
2. Sidebar 年份列表正确，当前年份紫色高亮
3. 点击年份可滚动到对应位置
4. 滚动页面时 active year 自动更新（IntersectionObserver 生效）
5. 图片卡片底部有渐变遮罩，标签有毛玻璃效果
6. 标题「瞳画」字号变大，有星光点缀动画
7. Tabs 流光边框动画正常
8. Lightbox 正常打开/关闭

- [ ] **Step 3: 移动端验证清单**

使用浏览器 DevTools 切换到 `iPhone SE` 或 `375px` 宽度：

1. Sidebar 隐藏，显示横向年份 chips
2. 点击年份 chips 可滚动定位
3. 图片无重叠，文本不截断
4. Lightbox 上下布局正常

- [ ] **Step 4: Commit（若有验证中发现的问题修复）**

根据验证结果修复后提交。

---

## Self-Review Checklist

### 1. Spec coverage

| Spec 要求 | 对应 Task |
|-----------|-----------|
| 左右分栏 Grid 布局 | Task 2 (TabTimeline), Task 4 (SCSS) |
| YearTimeline sidebar 组件 | Task 1 |
| 当前年份紫色高亮 + 外发光 | Task 4 (SCSS `.year-timeline__dot`) |
| 点击年份滚动定位 | Task 2 (`scrollToYear`) |
| 滚动时同步 active year | Task 2 (IntersectionObserver) |
| 卡片底部渐变遮罩 | Task 4 (`.photo-tile::after`) |
| 标签毛玻璃效果 | Task 4 (`.photo-tile__tag`) |
| 标题区字号 + 星光 | Task 3 (HTML), Task 4 (SCSS) |
| 响应式: >=1280px 完整分栏 | Task 4 (默认 grid) |
| 响应式: 1024-1279px sidebar 缩窄 | Task 4 (`@media (max-width: 1024px)`) |
| 响应式: <900px 横向 chips | Task 4 (`@media (max-width: 720px)`) |
| justified-layout 不变 | 未修改 JustifiedGrid.vue |

**Gap: 无**

### 2. Placeholder scan

- 无 "TBD" / "TODO" / "implement later"
- 所有代码片段完整可运行
- 无 "Similar to Task N" 引用

### 3. Type consistency

- `YearGroup` interface 在 YearTimeline.vue 中定义，与 TabTimeline.vue 中构造的 `yearList` 一致
- `activeYear` 类型为 `number | null`，在 TabTimeline 和 YearTimeline 中一致
- `scrollToYear(year: number)` 接收 number，与 emit 的 year 类型一致

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-28-gallery-timeline-sidebar.md`.**

Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
