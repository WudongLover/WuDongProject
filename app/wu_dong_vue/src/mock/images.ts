import type { ImageSize } from '@/types'
import { IMAGE_MAP } from './image-map'

/**
 * 图片地址：命中本地映射则返回 public/images 下的本地路径，否则回退文生图接口。
 * 本地图片随仓库提交，pull 下来即可正常显示。
 */
export function img(prompt: string, size: ImageSize = 'landscape_16_9'): string {
  const url = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
    prompt,
  )}&image_size=${size}`
  return IMAGE_MAP[url] ?? url
}

/** 统一给 prompt 补上乌东苗寨的风格基调，保证整站图片观感一致 */
export function scene(desc: string, size: ImageSize = 'landscape_16_9'): string {
  return img(
    `${desc}, Wudong Miao village in Guizhou China, wooden stilt houses, indigo dyed textiles, documentary travel photography, natural light`,
    size,
  )
}
