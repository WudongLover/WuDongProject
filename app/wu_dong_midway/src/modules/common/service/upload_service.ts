/**
 * 【common 模块】图片上传：类型/大小校验 + 阿里云 OSS 存储
 *
 * 说明：
 * - 仅存储照片（jpg/png/webp/gif，单张 ≤10MB），对象键规则见 src/comm/oss.ts；
 * - 不写 wudong_common_file 表（该表保持现状，删图与审计后续再补）；
 * - OSS 未配置时返回业务错误而非 500 崩溃，便于本地未配置时联调其它功能。
 */
import { Provide } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import * as fs from 'fs';
import { ApiError } from '../../m5-community/error/api_error';
import {
  MAX_IMAGE_SIZE,
  extFromMime,
  extFromName,
  getOssClient,
  isImageMime,
  mimeFromName,
} from '../../../comm/oss';

/** 允许的“场景”取值：决定对象键目录，非法值回退 misc */
const SCENE_WHITELIST = [
  'post',
  'avatar',
  'review',
  'product',
  'homestay',
  'route',
  'scenic',
  'cover',
];

/** @midwayjs/upload 解析出的文件信息（mode=file 时 data 为临时文件路径） */
interface UploadFileInfo {
  filename: string;
  fieldName: string;
  mimeType: string;
  data: string;
}

export interface UploadResult {
  /** 公网访问地址（公共读） */
  url: string;
  /** OSS 对象键 */
  key: string;
  size: number;
  mime: string;
}

@Provide()
export class UploadService {
  /**
   * 上传单张图片
   * @param ctx Koa 上下文（文件由 @midwayjs/upload 中间件解析到 ctx.files）
   * @param scene 业务场景，如 post / avatar，用于生成对象键目录
   */
  async uploadImage(ctx: Context, scene?: string): Promise<UploadResult> {
    const files = ((ctx as any).files || []) as UploadFileInfo[];
    const file = files.find((item) => item.fieldName === 'file') || files[0];
    if (!file || !file.data) {
      throw new ApiError(1000, '请选择要上传的图片', 400);
    }

    try {
      // 大小校验：临时文件已落盘，用真实文件大小而非请求头
      let size = 0;
      try {
        size = fs.statSync(file.data).size;
      } catch {
        throw new ApiError(1000, '上传文件已失效，请重新选择', 400);
      }
      if (size <= 0) {
        throw new ApiError(1000, '上传文件为空', 400);
      }
      if (size > MAX_IMAGE_SIZE) {
        throw new ApiError(1000, '图片大小不能超过 10MB', 400);
      }

      // 类型校验：以 MIME 为准，MIME 缺失时回退文件名后缀
      const mime = (file.mimeType || '').toLowerCase().split(';')[0].trim();
      const ext = extFromMime(mime) || extFromName(file.filename);
      if (!isImageMime(mime) && !ext) {
        throw new ApiError(1000, '仅支持 jpg / png / webp / gif 图片', 400);
      }

      const oss = getOssClient();
      if (!oss.enabled) {
        throw new ApiError(1500, '图片上传服务未配置（OSS），请联系管理员', 503);
      }

      const key = oss.buildKey(this.normalizeScene(scene), ext || file.filename);
      const result = await oss.putFile(
        file.data,
        key,
        mime || mimeFromName(file.filename)
      );
      return {
        url: result.url,
        key: result.key,
        size,
        mime: mime || mimeFromName(file.filename),
      };
    } finally {
      // 临时文件由中间件超时清理，这里在处理结束后及时回收，避免堆积
      const cleanup = (ctx as any).cleanupRequestFiles;
      if (typeof cleanup === 'function') {
        await cleanup.call(ctx);
      }
    }
  }

  /** 场景名兜底：白名单外统一归到 misc，避免出现不可控目录 */
  private normalizeScene(scene?: string): string {
    const value = String(scene || '').toLowerCase().trim();
    if (!value) {
      return 'post';
    }
    return SCENE_WHITELIST.includes(value) ? value : 'misc';
  }
}
