import type { ImageSize } from '@/types'

/**
 * 文生图占位图：后续接入 MinIO/OSS 后替换为上传接口返回的 URL 即可。
 * 列表场景请使用缩略图口径（≤200KB），详情页才用大图。
 */
export function img(prompt: string, size: ImageSize = 'landscape_16_9'): string {
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
    prompt,
  )}&image_size=${size}`
}

/** 统一给 prompt 补上乌东苗寨的风格基调，保证整站图片观感一致 */
export function scene(desc: string, size: ImageSize = 'landscape_16_9'): string {
  return img(
    `${desc}, Wudong Miao village in Guizhou China, wooden stilt houses, indigo dyed textiles, documentary travel photography, natural light`,
    size,
  )
}
