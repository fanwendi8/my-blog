# Gallery 时间轴侧栏布局设计

日期: 2026-04-28
状态: 待审查

## 背景

用户提供了新的 AI 设计稿（`tmp/ChatGPT Image gallery-timeline.png`）及详细拆解，要求将 Gallery「时间线」Tab 重构为"左侧年份时间轴 Sidebar + 右侧图库主体"的左右分栏布局。此前 2026-04-27 的 spec 明确排除了年份侧栏，本次根据新设计稿重新纳入。

## 目标

- 将 TabTimeline 从"时间轴点嵌套在年份组内"改为"左侧独立 Sidebar + 右侧内容区"布局。
- 保持 `justified-layout` 图片布局系统完全不变（用户明确要求）。
- 优化时间轴、卡片、标题区的视觉，使其更接近设计稿的"轻盈光影"气质。
- 保证桌面端与移动端布局稳定，无重叠/溢出。

## 非目标

- 不替换 `justified-layout` 布局系统。
- 不修改图片文件、数据源、CDN 路径、构建脚本。
- 不新增搜索、点赞、收藏等业务功能。
- 不修改 GalleryTabs 的 DOM/事件（只调整定位）。
- 不修改 PhotoSwipe Lightbox 逻辑。

## 设计决策

### 1. 整体布局骨架

时间线 Tab 采用 CSS Grid 左右分栏：

```css
.gallery-tab--timeline {
  display: grid;
  grid-template-columns: 170px minmax(0, 1fr);
  column-gap: 48px;
}
```

- 左侧 Sidebar：`position: sticky; top: 100px;` 跟随滚动。
- 右侧内容区：标题已在外层 GalleryHome，这里放年份分组 + JustifiedGrid。

### 2. 左侧时间轴 Sidebar（YearTimeline）

- 宽度 170px，包含垂直贯穿中线。
- 当前年份：紫色 `#946cff`，22px 字重 700，节点为 20px 紫色描边圆点 + 外发光。
- 其他年份：灰色 `#8c8f99`，16px 字重 400，节点为 10px 灰色圆点。
- 每个年份显示作品数量（14px，灰色）。
- 点击年份滚动定位到对应年份的图库区。
- 底部固定"时光无界"轻卡片（可选，本次优先保证时间轴功能）。

### 3. 右侧内容区

- GalleryTabs 移到 GalleryHome 中，放在 grid 外部或内容区顶部，保持 capsule 样式和流光边框动画。
- 内容区内按年份分组，每组保留年份标题（弱化，因为 sidebar 已显示年份）或直接显示 JustifiedGrid。
- 每个年份组之间保留适当间距（约 48px）。

### 4. 图片卡片优化

- 底部渐变遮罩：`linear-gradient(to top, rgba(0,0,0,.58), transparent)`。
- 标签改为毛玻璃效果：`backdrop-filter: blur(8px)`，`background: rgba(255,255,255,.18)`，`border: 1px solid rgba(255,255,255,.24)`。
- 日期和标题位置调整到底部左侧。
- Hover 效果保持现有 translateY + shadow。

### 5. 标题区优化

- GalleryHome 标题「瞳画」字号提升到 42-44px，增加紫色星光 `✦` 点缀。
- 副标题「55 件作品」弱化处理（灰色，16px）。
- 整体向左对齐到内容区起点。

### 6. 响应式方案

| 断点 | 行为 |
|------|------|
| >= 1280px | 完整左右分栏，sidebar 170px |
| 1024-1279px | sidebar 缩窄到 130px，间距减小 |
| < 900px | sidebar 隐藏，改为横向年份 chips 放在 tabs 下方 |
| < 640px | 单列布局，标题字号减小，tabs 折行 |

## 组件变更

### 修改文件

1. **`TabTimeline.vue`** —— 核心重构
   - 提取 Sidebar 为独立模板区域（或拆分为 `YearTimeline.vue` 子组件）。
   - 右侧改为遍历 yearGroups，每个 group 内放 JustifiedGrid。
   - 添加滚动定位逻辑（点击 sidebar 年份 → scrollIntoView）。

2. **`GalleryHome.vue`** —— 轻量调整
   - 标题区样式微调（字号、间距）。
   - GalleryTabs 位置可能需要调整（从 `margin-left: 112px` 改为与内容区对齐）。

3. **`_gallery.scss`** —— 大量样式更新
   - 新增 `.timeline-sidebar`、`.timeline-content` 布局样式。
   - 调整 `.timeline` 相关样式（或保留用于其他 tab）。
   - 优化 `.photo-tile__meta`、`.photo-tile__tag` 样式。
   - 新增响应式断点样式。
   - 调整 `.gallery-tabs` 的 margin/position。

### 新增文件

- **`YearTimeline.vue`**（可选，若内联在 TabTimeline 中则不需要）

## 测试与验收

- `npm run docs:build` 成功。
- 桌面端：时间线 Tab 显示左侧 sidebar + 右侧图库，点击年份可定位。
- 移动端（< 900px）：sidebar 隐藏，显示横向年份筛选。
- Lightbox 正常打开/关闭。
- 图片无重叠，文本不截断。
