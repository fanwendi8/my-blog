# Gallery 性能测试工具

针对 gallery 构建流程和前端渲染的综合性性能/功能测试。

## 快速开始

```bash
# 运行完整性能测试（默认每场景5张，共55张）
npm run gallery:perf

# 指定每场景图片数量（例如10张 = 110张总图）
npm run gallery:perf -- 10

# 运行前端布局性能测试（需先执行 gallery:perf 生成 manifest）
npm run gallery:perf:frontend
```

## 测试内容

### 1. 构建流程测试 (`run.mjs`)

生成多样化测试图片并执行完整 build 流程，测量各环节耗时与内存占用。

**生成的测试数据：**
- 11 个场景（风景/日落、风景/海边、风景/山脉、城市/街拍、城市/夜景、人像/室内、人像/黑白、建筑/现代、建筑/古典、动物/野生、动物/宠物）
- 每个场景包含横版(3:2)、竖版(2:3)、宽幅(16:9)、正方形(1:1)等多种比例
- 目录结构自动映射为 tag（如 `风景/日落/` → tags: `["风景", "日落"]`）

**预设专辑：**
| 专辑 | 规则 |
|---|---|
| 2024 精选 | 每个场景前 2 张 |
| 城市漫步 | 所有含 "城市" tag 的照片 |
| 自然之美 | 所有含 "风景" 或 "动物" tag 的照片 |
| 黑白世界 | 含 "人像" + "黑白" tag 的照片 |
| 光影实验 | 含 "建筑" tag 的前 5 张 |
| 空专辑 | 0 张照片，测试空状态 |

**输出指标：**
- 各环节耗时：扫描、EXIF 提取、衍生图生成、Blurhash 编码
- 内存增量与峰值
- 单张平均处理耗时

### 2. 前端性能测试 (`frontend-perf.mjs`)

在 Node 环境中模拟前端布局与筛选算法，测量纯 JS 计算性能。

**测试项：**
- `justified-layout` 在不同容器宽度、目标行高下的计算耗时
- `filterPhotos` 按 tag / album 筛选的耗时
- 规模扩展测试（10 ~ 1000 张照片）

## 测试文件结构

```
perf/
  generate-fixtures.mjs   # 测试图片生成器（sharp + SVG 文字）
  build-with-tags.mjs     # 支持 tag 提取的 build 包装器
  run.mjs                 # 主测试入口
  frontend-perf.mjs       # 前端布局/筛选性能测试
  gallery-staging-perf/   # 临时测试图片目录（自动生成）
```

## 注意事项

- 衍生图生成（sharp resize + 多格式编码）是 build 流程的主要耗时环节，约占总耗时的 95%+
- 测试会覆盖 `docs/.vuepress/public/gallery/data/` 下的 manifest 文件
- 测试缓存写入 `.gallery-cache/` 目录，如需纯净测试环境会自动清理
