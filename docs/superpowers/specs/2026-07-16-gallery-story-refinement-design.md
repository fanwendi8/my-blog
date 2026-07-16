# Story 画册页面视觉收紧设计

状态：待用户复核。

## 背景

当前相册化 story 已经具备 4:3 网格、缩略图加载和 story-level lightbox，但页面仍带有站点导航和偏重的控制元素。目标是让 story 更像一张纯粹的摄影画册：照片是唯一主角，文字、返回入口和 lightbox 控件都退到辅助层。

本次调整建立在既有 Gallery Album Redesign 之上，不改变照片数据模型、图库构建方式、旧图片组件兼容能力或首页结构。

## 目标与范围

- story 页面不保留任何站点级导航：隐藏品牌入口、顶部导航链接、移动端菜单按钮和导航栏占位；博客和笔记页面不做改动。
- 压缩 story 标题、日期、地点和简介区域，使其与相册节奏统一。
- 使用“细边框 + 白色内衬”的相框形式，增强边界但不引入阴影、圆角或厚重拟物感。
- 相册末尾改为居中的无文字返回图标，保留明确的无障碍名称和键盘焦点。
- 收敛 story lightbox 控件：移除右上角关闭按钮，左右切换改为靠近屏幕边缘的低对比度细线箭头，不遮挡照片。
- 保留背景点击、Esc 和垂直拖动关闭能力；不改变不循环、计数、键盘和移动端滑动行为。

不在本次范围内：

- 不改变 Gallery 首页的档案结构。
- 不更换全站字体、主题色或博客/笔记页面布局。
- 不新增下载、分享、全屏等 lightbox 操作。
- 不删除 `StoryPhoto`、`StoryPhotos`、`StorySplit`。

## 视觉方案

### Story 页面壳层

仅对 `.photo-story-page` 生效：

- 移除顶部导航栏及其占用空间，不保留品牌入口、导航链接或移动端菜单按钮。
- 页面保持纯白背景。
- story 内容使用紧凑的垂直节奏，标题区与相册之间保留 28px 间距。

### 标题区

- 桌面标题字号为 30px，移动端为 25px；使用现有字体系统，不引入新字体。
- 日期与地点作为一行低对比度 metadata，字号为 12px。
- 简介最大宽度为 600px，字号为 15px，行高为 1.65。
- 标题、metadata 和简介左对齐，与相册左边界对齐；不使用额外卡片或装饰线。

### 相框网格

- 相框继续统一为 4:3，图片继续使用 `contain`，不裁切。
- 相框外框为 `1px solid #cfcfcf`。
- 相框内部保留 6px 白色内衬，形成清晰但轻量的边界。
- 不使用阴影、圆角或厚边框；图片本身不增加 hover 缩放。
- 网格间距调整为 20px，caption 仍位于相框下方，不覆盖照片。
- 保留桌面 4 列、平板 3 列、移动端 2 列。

### 返回入口

相册结束后居中放置一个 icon-only `RouterLink`：

- 使用细线左箭头图标，不显示“返回瞳画”文字。
- 点击区域不小于 32px，但视觉上不绘制实体按钮背景或边框。
- `aria-label="返回瞳画"`，同时设置 `title="返回瞳画"` 提供原生 tooltip。
- 保留明显的 `:focus-visible` 状态。

### Story lightbox

Story lightbox 使用独立的 `mainClass` 和 options，避免影响全站 PhotoSwipe：

- 右上角关闭按钮隐藏。
- 点击白色背景、Esc、垂直拖动仍可关闭。
- 左右箭头保留功能，但不显示按钮底色、边框或大面积图标容器；使用低对比度细线 chevron，放置在 viewport 左右边缘的留白区域。
- 箭头点击区域固定为 36px，视觉 chevron 为 20px，默认透明度为 0.55，hover/focus 时提升至 0.9；在移动端也不压住照片内容。
- 计数器固定在底部居中，距离底部 24px，使用低调小字，不与箭头形成视觉重心。
- caption 继续位于图片外的留白区域，不覆盖照片。
- 保持 `loop: false`、首尾禁用箭头、键盘方向键、移动端左右滑动和禁用缩放。

## 实现边界

- `StoryAlbum.vue` 只负责相册 DOM、返回入口和 story lightbox 初始化。
- `PhotoStoryHeader.vue` 只负责紧凑标题信息，不把页面导航逻辑放入组件。
- `_gallery.scss` 使用 `.photo-story-page`、`.story-album` 和 `.story-album-lightbox` 作用域，避免污染其他页面。
- `storyAlbumPhotoSwipe.ts` 继续作为 story 专属 options 和 UI 注册入口，关闭按钮只通过 story options/CSS 隐藏。
- 不修改照片 manifest 字段或 CDN URL 拼接逻辑。

## 验证

- 组件测试断言 icon-only 返回入口具备 `aria-label`、网格边界 class 和紧凑内容结构。
- lightbox 测试断言 story options 隐藏 close、保留 arrow/counter、并继续禁用缩放与循环。
- 运行 `npm test`、`npm run gallery:test` 和 `npm run docs:build`。
- dev server 检查 story 页面：无顶部导航、相框边界清晰、返回图标可识别、lightbox 箭头不遮挡图片且无右上角关闭按钮。

## 验收标准

进入 story 后，页面像一张纯白背景上的摄影画册：没有任何站点级导航，标题区紧凑，相框边界清晰但不厚重，底部只保留一个易识别的返回箭头作为退出动作。打开照片后，左右切换足够轻、不遮挡照片，右上角不出现关闭按钮，同时仍可通过背景、Esc 或垂直拖动退出。
