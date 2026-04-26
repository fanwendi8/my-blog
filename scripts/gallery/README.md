# Gallery 内容工作流

把放在 `gallery-staging/` 下的原图处理为 `docs/.vuepress/public/gallery/data/` 下的 manifest，
并（可选）把多尺寸衍生图上传到 Cloudflare R2。

## 使用

```bash
# 仅生成本地 manifest + 本地缓存衍生图
npm run gallery:build

# 同上但额外上传到 R2（需配置 R2_* 环境变量）
npm run gallery:build -- --upload

# 演练（不写文件不上传）
npm run gallery:build -- --dry-run
```

## 环境变量

| 变量 | 说明 |
|---|---|
| `R2_ENDPOINT` | 例 `https://<account-id>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` | R2 API token |
| `R2_SECRET_ACCESS_KEY` | R2 API secret |
| `R2_BUCKET` | 存储桶名 |
| `R2_PUBLIC_BASE` | 例 `https://img.fanwendi.fun`（也用作前端 `__GALLERY_CDN_BASE__`） |
| `GALLERY_CDN_BASE` | VuePress 编译期注入，前端 `<img>` URL 拼接的前缀 |

## 专辑配置

`scripts/gallery/albums.config.mjs` 是专辑归属的 single source of truth。
按 `{ id, title, desc, cover, createdAt, photos: [photoId, ...] }` 形式编写。
`photos` 数组中的 id 必须对应已生成的 `photos.json` 中的某个 id，否则 build 会报错退出。
