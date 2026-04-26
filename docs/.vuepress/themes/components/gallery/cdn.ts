// docs/.vuepress/themes/components/gallery/cdn.ts
// 编译期常量 - 来源于 vuepress define 注入的 __GALLERY_CDN_BASE__
declare const __GALLERY_CDN_BASE__: string | undefined
const ENV_BASE = (typeof __GALLERY_CDN_BASE__ !== 'undefined' ? __GALLERY_CDN_BASE__ : '') as string

export function cdnUrl(base: string, key: string): string {
  if (!base) return `/gallery-img/${key}`
  return `${base.replace(/\/+$/, '')}/${key}`
}

export function publicSrc(key: string): string {
  return cdnUrl(ENV_BASE, key)
}
