import type { ImageSize } from '@/types'
import { IMAGE_MAP, toOssUrl } from './image-map'

/**
 * 图片地址：命中映射后返回 OSS 访问地址（未配置 VITE_OSS_BASE_URL 时回退 public/images 本地文件），
 * 未命中映射则回退文生图接口。
 */
export function img(prompt: string, size: ImageSize = 'landscape_16_9'): string {
  const url = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
    prompt,
  )}&image_size=${size}`
  const local = IMAGE_MAP[url]
  return local ? toOssUrl(local) : url
}

/** 统一给 prompt 补上乌东苗寨的风格基调，保证整站图片观感一致 */
export function scene(desc: string, size: ImageSize = 'landscape_16_9'): string {
  return img(
    `${desc}, Wudong Miao village in Guizhou China, wooden stilt houses, indigo dyed textiles, documentary travel photography, natural light`,
    size,
  )
}
