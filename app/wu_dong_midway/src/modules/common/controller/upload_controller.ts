/**
 * 【common 模块】图片上传接口
 * POST /api/upload —— multipart 单文件（字段 file，可选 ?scene=post|avatar|...）
 * 需登录（见 middleware/auth_middleware.ts）；返回统一信封 { code, message, data: { url, key, size, mime } }
 */
import { Controller, Inject, Post, Query } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { UploadService } from '../service/upload_service';

@Controller('/api')
export class UploadController {
  @Inject()
  ctx: Context;

  @Inject()
  uploadService: UploadService;

  /** 上传照片到 OSS：字段名固定 file，多图由前端逐张调用 */
  @Post('/upload')
  async upload(@Query('scene') scene?: string) {
    const data = await this.uploadService.uploadImage(this.ctx, scene);
    return { code: 0, message: 'ok', data };
  }
}
