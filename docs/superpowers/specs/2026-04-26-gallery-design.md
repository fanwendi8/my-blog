# 瞳画 Gallery 设计文档

- **日期**: 2026-04-26
- **作者**: fanwendi8 (with Claude)
- **状态**: 草案 · 待用户审阅
- **关联**: `/gallery/`(路由) · `vuepress-theme-plume` · Cloudflare Pages 部署

---

## 1. 背景与目标

`docs/gallery/` 目前是占位页 (`> 页面开发中,敬请期待...`),配置 `home: true` + `type: custom`,导航栏"瞳画"已指向 `/gallery/`。本设计目标是把它落地为一个可承载 **2000+ 张** 个人摄影作品、具备高性能多图大图渲染能力的 gallery 页面。

### 1.1 已确认的需求与约束

| 维度 | 决策 |
|---|---|
| 图片存储 | 外部对象存储 (Cloudflare R2) |
| 规模目标 | 2000+ 张 |
| 内容组织 | 三级并存:**专辑** + **时间流** + **标签** |
| 元数据来源 | 本地 Node 脚本自动生成 (EXIF + Sharp + BlurHash) |
| 多尺寸生成 | 本地预生成 thumb/preview/large + webp/avif |
| 入口布局 | 顶部 Tab 切换三视图(时间线 / 专辑 / 标签) |
| 缩略图栅格 | Justified Rows (Flickr 风,行内等高、宽度按图比例填满) |
| 大图查看器 | 丰富 lightbox:信息面板 (标题/EXIF/GPS) + 分享 + 缩略图条 |
| 部署目标 | Cloudflare Pages (域名 fanwendi.fun) |
| 单图链接 | Hash 深链(`/gallery/#p=<id>`) |

### 1.2 技术选型

| 角色 | 选型 | 理由 |
|---|---|---|
| Justified 几何 | `justified-layout` | Flickr 出品,纯算法,无 UI 耦合 |
| Lightbox | `PhotoSwipe v5` | 框架无关,缩放/手势/键盘/全屏自带,UI 注入点充分 |
| 行级虚拟滚动 | `virtua` | Vue 3 原生,支持非线性高度 |
| 占位 | `blurhash` | 30 字节哈希,低带宽预览 |
| 图片处理 | `sharp` + `exifr` | Node 端事实标准 |
| CDN 上传 | `@aws-sdk/client-s3` (S3 协议兼容 R2) | R2 原生支持 S3 API |

---

## 2. 整体架构

按职责分三层,层间通过 manifest JSON 与 URL 模式解耦。

```
┌──────────────────────────────────────────────────────────────┐
│  层 ①  内容工作流 (本地 Node CLI)                              │
│  原图 staging                                                 │
│       │                                                       │
│       ▼                                                       │
│  scripts/gallery/build.mjs                                    │
│   • 扫描原图,计算内容哈希作为 id                              │
│   • exifr 读 EXIF;sharp 生成 thumb / preview / large          │
│   • 输出 webp + avif + blurhash                               │
│   • @aws-sdk/client-s3 上传到 R2 (跳过已存在)                  │
│   • 输出 manifest:                                            │
│       photos.json   ← 全量 (id/尺寸/blurhash/EXIF/标签)        │
│       albums.json   ← 专辑 (id/封面/标题/photo ids)            │
│       tags.json     ← 标签倒排                                │
└──────────────────────────────────────────────────────────────┘
                       │
                       ▼ 写入 docs/.vuepress/public/gallery/data/
┌──────────────────────────────────────────────────────────────┐
│  层 ②  VuePress 站点 (SSG · 客户端 hydrate)                    │
│  docs/gallery/README.md  (home: true · type: custom)          │
│       │                                                       │
│       ▼                                                       │
│  layouts/GalleryHome.vue    顶部 Tab + 视图容器                │
│       ├─ TabTimeline.vue    时间线 (Justified)                │
│       ├─ TabAlbums.vue      专辑卡片网格                      │
│       └─ TabTags.vue        标签云 + 过滤后的 Justified        │
│  共用组件                                                      │
│       ├─ JustifiedGrid.vue  justified-layout + virtua         │
│       ├─ PhotoTile.vue      blurhash + lazy <img>             │
│       ├─ Lightbox.vue       PhotoSwipe v5 包装                │
│       └─ PhotoInfoPanel.vue EXIF/标签/位置/下载                │
└──────────────────────────────────────────────────────────────┘
                       │
                       ▼ <img src=cdn-url>
┌──────────────────────────────────────────────────────────────┐
│  层 ③  Cloudflare R2 (静态对象 CDN)                            │
│  bucket/<photo-id>/thumb.webp                                 │
│  bucket/<photo-id>/preview.webp + .avif                       │
│  bucket/<photo-id>/large.webp + .avif                         │
│  bucket/<photo-id>/orig.jpg     (可选,下载原图入口)           │
└──────────────────────────────────────────────────────────────┘
```

**边界契约**:

- 层 ①/② 之间:`manifest JSON 字段` 是契约,改字段需要双侧同步
- 层 ②/③ 之间:`<R2-base-url>/<photo-id>/<size>.<ext>` URL 模式是契约,换 CDN 只改一个 base 常量
- manifest 走 `public/gallery/data/`,VuePress 不会处理它,运行时 `fetch()` 拉取

---

## 3. Manifest 形态与数据流

### 3.1 photos.json — 全量索引(按 takenAt 倒序)

```jsonc
[
  {
    "id": "20250423-DSC0142",          // 内容哈希前 12 位 (sha256),稳定不重复
    "src": {
      "thumb":   "img/20250423-DSC0142/thumb.webp",   // 320w
      "preview": "img/20250423-DSC0142/preview.webp", // 1280w
      "large":   "img/20250423-DSC0142/large.webp"    // 2560w
    },
    "w": 6000, "h": 4000,              // 原始像素尺寸 (Justified 算法用)
    "blurhash": "LEHV6nWB2yk8...",
    "title": "灵境胡同",
    "desc":  "雨后的水洼,把胡同折成两个世界",
    "takenAt": "2025-04-23T17:42:11+08:00",
    "exif": {
      "camera": "SONY ILCE-7M4",
      "lens":   "FE 35mm F1.4 GM",
      "fl":     35,
      "fn":     2.8,
      "iso":    400,
      "exp":    "1/250"
    },
    "gps":   { "lat": 39.92, "lon": 116.40 },
    "albums": ["beijing-hutongs"],
    "tags":   ["街拍", "胶片色"]
  }
]
```

### 3.2 albums.json — 专辑导航

```jsonc
[
  {
    "id": "beijing-hutongs",
    "title": "胡同里",
    "cover": "20250423-DSC0142",       // 引用 photos[].id
    "desc":  "三年间走过的几十条北京胡同",
    "count": 84,
    "createdAt": "2024-12"
  }
]
```

### 3.3 tags.json — 标签倒排

```jsonc
[
  { "name": "街拍", "count": 320 },
  { "name": "胶片色", "count": 156 }
]
```

### 3.4 加载策略

```
GalleryHome 挂载
   │
   ├─ fetch('/gallery/data/albums.json')  (~5KB)   立刻渲染专辑封面
   ├─ fetch('/gallery/data/tags.json')    (~3KB)
   └─ fetch('/gallery/data/photos.json')  (~120KB after gzip)
```

- 三个 JSON 并行 `fetch`,Promise.all 后渲染
- 不分片:2000 张 photos.json gzip 后 ~120KB 可接受;**超过 5000 张** 再考虑按月分片(`photos-2025-04.json`)
- 缓存:HTTP 长缓存 + 构建哈希指纹(`?v=<buildId>`)
- 状态:不引入 Pinia。一个 composable `useGalleryData()` 用 `ref` 单例共享

### 3.5 必填 vs 选填字段

- **必填**:`id`、`src.thumb`、`src.large`、`w`、`h`、`blurhash`、`takenAt`
- **选填**:`title`、`desc`、`exif.*`、`gps`、`albums`、`tags`、`src.preview`
- 脚本读不到选填字段时缺省,前端做容错(隐藏/降级)

### 3.6 深链 hash 解析

```
URL 形态: /gallery/#tab=timeline&p=20250423-DSC0142

GalleryHome onMounted:
  const hash = parseHash(location.hash)
  activeTab.value = hash.tab ?? 'timeline'
  if (hash.p) openLightbox(hash.p)

Lightbox open / close / navigate:
  history.replaceState(null, '', `#tab=${tab}&p=${id}`)
  // 不污染历史栈,刷新可恢复

window.addEventListener('hashchange', resync)
  // 浏览器后退/前进同步状态
```

---

## 4. 组件分解

### 4.1 内容工作流 (`scripts/gallery/`)

```
scripts/gallery/
├─ build.mjs              主入口 · 命令: npm run gallery:build -- [--upload] [--dry-run]
├─ scan.mjs               扫描 staging/,匹配新增/修改文件
├─ exif.mjs               exifr 提取 + 字段标准化
├─ derivatives.mjs        sharp 生成 thumb/preview/large + webp/avif
├─ blurhash.mjs           blurhash 编码 (32x32 缩放 → 4×3 分量)
├─ uploader.mjs           R2/S3 上传,内容寻址跳过已传
├─ manifest.mjs           合并新旧记录 → 写 photos.json/albums.json/tags.json
└─ albums.config.mjs      用户手写: 专辑定义 + photo id 归属映射
```

每个文件单一职责,纯函数为主,主入口编排。`albums.config.mjs` 是唯一需要长期手动维护的 — 专辑是创作意图,不能从 EXIF 自动推断。**`albums.config.mjs` 是专辑归属的 single source of truth**:用户在此文件中声明"专辑 → photo id 列表",`manifest.mjs` 据此回填到 `photos[].albums`,避免双源同步问题。

### 4.2 站点端 (`docs/.vuepress/themes/`)

```
themes/
├─ layouts/
│   └─ GalleryHome.vue            顶部 Tab + 三视图容器
├─ components/gallery/
│   ├─ GalleryTabs.vue            三 tab 切换 UI
│   ├─ TabTimeline.vue            时间线视图
│   ├─ TabAlbums.vue              专辑卡片网格
│   ├─ TabTags.vue                标签云 + 过滤后的 Justified
│   ├─ AlbumDetail.vue            单专辑展开
│   ├─ JustifiedGrid.vue          核心: justified-layout + virtua 行虚拟化
│   ├─ PhotoTile.vue              单图: blurhash canvas + lazy <img>
│   ├─ Lightbox.vue               PhotoSwipe v5 包装
│   └─ PhotoInfoPanel.vue         PhotoSwipe 右侧 EXIF/标签/位置/下载
├─ composables/
│   ├─ useGalleryData.ts          单例 fetch + 派生索引
│   ├─ useGalleryRoute.ts         hash 解析/写回
│   └─ useFiltering.ts            标签/专辑/年月过滤
└─ styles/
    └─ _gallery.scss              gallery 主题变量 + 暗色适配
```

### 4.3 关键组件接口

```vue
<!-- JustifiedGrid · 复用 - 时间线/标签/专辑详情都用它 -->
<JustifiedGrid
  :photos="filteredPhotos"
  :target-row-height="240"
  :gap="6"
  @click="onTileClick(id)"
/>
<!-- 内部: 容器宽度变化 → 重算 layout, virtua 只渲染可见行 -->
```

```vue
<!-- PhotoTile · 单图 -->
<PhotoTile
  :photo="photo"
  :width="220" :height="146"      <!-- Justified 计算后注入 -->
  :loading="lazy | eager"          <!-- 第一屏 eager -->
/>
<!-- 内部: blurhash canvas 立即绘制, IntersectionObserver 触发后换 thumb webp -->
```

```vue
<!-- Lightbox · 全局单实例 -->
<Lightbox
  :open="!!activePhotoId"
  :photo-id="activePhotoId"
  :photos="visiblePhotos"          <!-- 当前 tab 的可滑动序列 -->
  @close="closeLightbox"
  @navigate="navigateTo"
/>
<!-- 内部: PhotoSwipe v5 instance, 关闭时回收 -->
```

### 4.4 SSR 兼容

所有依赖 DOM 的依赖(PhotoSwipe / virtua / blurhash 解码 / IntersectionObserver)都在 `onMounted` 内初始化,组件以 `<ClientOnly>` 包裹。VuePress 静态渲染时只输出占位骨架。

### 4.5 客户端注册

参照现有 `docs/.vuepress/client.ts` 的模式,在 `enhance({ app })` 中注册新组件,SCSS 在 `themes/styles/index.scss` 中 import。

---

## 5. 错误处理

### 5.1 内容工作流端

| 异常 | 处理 |
|---|---|
| 原图损坏 / 不能读 | skip 该文件,日志告警,继续处理其他 |
| EXIF 缺失 / 异常 | 字段缺省为 `null`,前端容错 |
| 上传失败 | 重试 3 次(指数退避),失败则中断,留下"已生成本地衍生图但未上传"的中间状态;再次运行时检测出未上传的继续 |
| `albums.config.mjs` 引用了不存在的 photo id | 启动时校验,直接报错退出 |
| 中途取消 | manifest 事务性写入(临时文件 → rename) |
| 重复运行 | 内容寻址(图片 hash 当 id),已存在的衍生图和上传跳过 |

### 5.2 站点端

| 异常 | 处理 |
|---|---|
| `photos.json` fetch 失败 | 显示重试按钮 + 错误提示,不阻塞 tab UI |
| 单图 large 加载失败 | Lightbox 按 `large → preview (若存在) → thumb → "图片加载失败"占位` 链路降级 |
| blurhash 解码失败 | 退化为单色占位(主题色) |
| 深链 hash 指向不存在的 photo id | 静默忽略,正常打开 tab(开发模式 console.warn) |
| 容器宽度为 0 (SSR / 隐藏 tab) | JustifiedGrid 不渲染,等 ResizeObserver |
| PhotoSwipe SSR | `<ClientOnly>` + `onMounted` 内动态 import |

原则:容错不等于静默。开发模式打 warn,生产模式只展示用户可理解的状态。

---

## 6. 测试策略

### 6.1 内容工作流(纯逻辑,Vitest)

- `exif.mjs` — 输入预设 JPEG buffer,断言提取后的字段
- `blurhash.mjs` — 输入小图 buffer,断言哈希字符串
- `manifest.mjs` — 输入新旧 photos 数组,断言合并/排序结果
- `albums.config` 校验 — 引用不存在 id 必须 throw

固定 fixture 放 `scripts/gallery/__fixtures__/`(几张小图 + 预期 JSON)。

### 6.2 站点组件(Vitest + @vue/test-utils)

- `useGalleryRoute.ts` — `parseHash` / `writeHash` 是纯函数,直接断言
- `useFiltering.ts` — 给定 photos + filter,断言结果集
- `JustifiedGrid.vue` — 注入 mock 容器宽度 + 几张固定比例图,断言 `justified-layout` 输出的几何
- `PhotoTile.vue` — 断言 IntersectionObserver 触发前后的 `<img>` src 切换

不测 PhotoSwipe 内部 — 它有自己的测试,我们只测 open/close/navigate 的事件驱动。

### 6.3 端到端(可选,Playwright)

- 跑 `npm run docs:build`,serve dist
- 打开 `/gallery/`,断言三 tab 出现,JustifiedGrid 渲染了至少 N 个 tile
- 点第一张 → Lightbox 打开,URL hash 含 `p=`
- 关闭 → hash 清空

如果不希望引入 Playwright,这层可以跳过,改为人工冒烟。

---

## 7. 实现里程碑

由 `writing-plans` 后续展开成详细任务,这里只列大致顺序与可演进的最小子集:

1. **M1 · 内容工作流骨架** — 脚本能扫描 1-2 张测试图片,产出 manifest + 上传 R2
2. **M2 · 站点最小渲染** — `GalleryHome` + `useGalleryData` + 单一 Tab(时间线)+ `JustifiedGrid` 渲染 manifest
3. **M3 · Lightbox** — `Lightbox` + `PhotoInfoPanel`,基础打开/翻页/关闭
4. **M4 · 三 tab + 过滤** — `TabAlbums` / `TabTags` / `useFiltering`
5. **M5 · 性能** — virtua 行级虚拟化、blurhash 占位、IntersectionObserver 懒加载
6. **M6 · 深链** — `useGalleryRoute` hash 解析与写回
7. **M7 · 容错与测试** — 错误状态 UI、单元测试 fixture、(可选) E2E

每个里程碑结束后页面应能独立 build + 浏览(后续里程碑增量增强)。

---

## 8. 不在范围 (Out of Scope)

明确不在本设计内,避免后续 scope creep:

- ❌ **每张图独立评论**(Giscus 不映射 hash 链接;整 gallery 共用一个评论区由 Plume 主题已配置)
- ❌ **管理后台/在线上传 UI** — 内容流程是本地 CLI
- ❌ **多用户/权限** — 个人站,不需要
- ❌ **相册私密分享 / 加密链接**
- ❌ **图片编辑(裁剪/滤镜)在前端**
- ❌ **搜索引擎(全文搜索图片标题)** — 标签 + 专辑 + 年月过滤已足够,后续若需要再独立加 fuse.js
- ❌ **每张图一个独立 SSG 页面** — 用 hash 深链替代,避免 2000+ 页构建
- ❌ **CDN 端 URL 变换** — 已选本地预生成,不依赖 Cloudinary/imgix 等付费服务

---

## 9. 验收标准

- [ ] `npm run gallery:build` 处理 staging 中至少 30 张测试图,生成 manifest + 上传 R2 + 命令成功退出
- [ ] `/gallery/` 页面正常渲染顶部三 tab,默认时间线视图显示 Justified 网格
- [ ] 点击任一图片打开 Lightbox,显示 EXIF 信息面板,可左右切换/关闭
- [ ] URL hash `#p=<id>` 直链能恢复对应 lightbox 状态
- [ ] 时间线滚动到底部不卡顿,DevTools 显示 DOM 节点数 ≪ 总图片数(虚拟化生效)
- [ ] manifest JSON 走 HTTP 长缓存 + 构建哈希指纹,二次访问 304 命中
- [ ] Lighthouse Performance ≥ 90 (gallery 页面)
- [ ] 暗色主题切换不破坏布局
