import { BaseUpload, MODETYPE } from './interface';
import { BasePluginHook } from '../base';
import * as fs from 'fs';
import * as path from 'path';
import * as moment from 'moment';
import { v1 as uuid } from 'uuid';
import { CoolCommException } from '@cool-midway/core';
import * as _ from 'lodash';
import { pUploadPath } from '../../../../comm/path';
import { getOssClient } from '../../../../comm/oss';

/**
 * 常见文件扩展名 → Content-Type（后台可上传图片/文档/视频等，非白名单场景退回二进制流）
 */
const EXT_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  zip: 'application/zip',
};

/** 扩展名 → MIME */
function mimeOfExt(ext: string): string {
  return EXT_MIME[String(ext || '').toLowerCase()] || 'application/octet-stream';
}

/**
 * 文件上传
 */
export class CoolPlugin extends BasePluginHook implements BaseUpload {
  /**
   * 生成 OSS 对象键：{OSS_PREFIX}/admin/{yyyyMM}/{uuid}.{ext}
   * 后台管理端不限定文件类型，这里不套用图片专用的 buildKey
   */
  private buildOssKey(ext: string): string {
    const prefix = getOssClient().config.prefix || 'wudong';
    const safeExt = String(ext || 'bin').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'bin';
    return `${prefix}/admin/${moment().format('YYYYMM')}/${uuid().replace(/-/g, '')}.${safeExt}`;
  }

  /** 客户端传入的 key（云存储模式下的相对路径）→ OSS 对象键 */
  private ossKeyOfClientPath(key: string): string {
    const prefix = getOssClient().config.prefix || 'wudong';
    return `${prefix}/admin/${this.sanitizePath(key)}`;
  }

  /**
   * 上传到 OSS；未配置或上传失败返回 null，由调用方回退本地存储。
   * @param file @midwayjs/upload 解析出的文件信息（data 为临时文件路径）
   * @param clientKey 客户端传入的对象键（可选）
   */
  private async uploadToOss(file: any, clientKey?: string): Promise<string | null> {
    const oss = getOssClient();
    if (!oss.enabled) {
      return null;
    }
    try {
      const originalFileName = path.basename(file.filename || '');
      const extension = (originalFileName.split('.').pop() || 'bin').toLowerCase();
      const objectKey = clientKey
        ? this.ossKeyOfClientPath(clientKey)
        : this.buildOssKey(extension);
      const res = await oss.putFile(file.data, objectKey, mimeOfExt(extension));
      return res.url;
    } catch (err: any) {
      console.warn('[upload] OSS 上传失败，回退本地存储：', err?.message || err);
      return null;
    }
  }

  /** 远程文件转存 OSS；未配置或失败返回 null */
  private async downAndUploadToOss(
    url: string,
    safeFileName: string
  ): Promise<string | null> {
    const oss = getOssClient();
    if (!oss.enabled) {
      return null;
    }
    try {
      const extension = path.extname(safeFileName).replace(/^\./, '').toLowerCase();
      const objectKey = this.buildOssKey(extension);
      let data: Buffer;
      if (url.includes('http')) {
        const download = require('download');
        data = await download(url);
      } else {
        data = fs.readFileSync(url);
      }
      const res = await oss.putBuffer(Buffer.from(data), objectKey, mimeOfExt(extension));
      return res.url;
    } catch (err: any) {
      console.warn('[upload] OSS 转存失败，回退本地存储：', err?.message || err);
      return null;
    }
  }

  /**
   * 验证路径安全性，防止路径遍历攻击
   * @param userInput 用户输入的文件名或路径
   * @returns 安全的文件名
   */
  private sanitizePath(userInput: string): string {
    if (!userInput) {
      return '';
    }
    // 检查是否包含路径遍历字符
    if (
      userInput.includes('..') ||
      userInput.includes('./') ||
      userInput.includes('.\\') ||
      userInput.includes('\\') ||
      userInput.includes('//') ||
      userInput.includes('\0') ||
      /^[a-zA-Z]:/.test(userInput) || // Windows绝对路径
      userInput.startsWith('/')
    ) {
      throw new CoolCommException('非法的文件路径');
    }
    // 规范化路径后再次检查
    const normalized = path.normalize(userInput);
    if (normalized.includes('..') || normalized.startsWith('/')) {
      throw new CoolCommException('非法的文件路径');
    }
    return normalized;
  }

  /**
   * 验证最终路径是否在允许的目录内
   * @param targetPath 目标路径
   * @param basePath 基础路径
   */
  private validateTargetPath(targetPath: string, basePath: string): void {
    const resolvedTarget = path.resolve(targetPath);
    const resolvedBase = path.resolve(basePath);
    if (!resolvedTarget.startsWith(resolvedBase + path.sep)) {
      throw new CoolCommException('文件路径超出允许范围');
    }
  }

  /**
   * 获得上传模式
   * @returns
   */
  async getMode() {
    return {
      mode: MODETYPE.LOCAL,
      type: MODETYPE.LOCAL,
    };
  }

  /**
   * 获得原始操作对象
   * @returns
   */
  async getMetaFileObj() {
    return;
  }

  /**
   * 下载并上传
   * @param url
   * @param fileName
   */
  async downAndUpload(url: string, fileName?: string) {
    const { domain } = this.pluginInfo.config;
    const basePath = pUploadPath();
    const dateDir = moment().format('YYYYMMDD');

    // 从url获取扩展名
    const extend = path.extname(fileName ? fileName : url);

    // 验证文件名安全性
    let safeFileName: string;
    if (fileName) {
      safeFileName = this.sanitizePath(fileName);
      // 只取文件名部分，去除可能的子目录
      safeFileName = path.basename(safeFileName);
    } else {
      safeFileName = uuid() + extend;
    }

    // 已配置 OSS：直接转存到对象存储并返回公网 URL
    const ossUrl = await this.downAndUploadToOss(url, safeFileName);
    if (ossUrl) {
      return ossUrl;
    }

    const download = require('download');
    // 数据
    const data = url.includes('http')
      ? await download(url)
      : fs.readFileSync(url);

    // 创建文件夹
    const dirPath = path.join(basePath, dateDir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const targetPath = path.join(dirPath, safeFileName);
    // 验证最终路径
    this.validateTargetPath(targetPath, basePath);

    fs.writeFileSync(targetPath, data);
    return `${domain}/upload/${dateDir}/${safeFileName}`;
  }

  /**
   * 指定Key(路径)上传，本地文件上传到存储服务
   * @param filePath 文件路径
   * @param key 路径一致会覆盖源文件
   */
  async uploadWithKey(filePath: any, key: any) {
    const { domain } = this.pluginInfo.config;
    const basePath = pUploadPath();
    const dateDir = moment().format('YYYYMMDD');

    // 验证key安全性
    const safeKey = this.sanitizePath(key);

    // 已配置 OSS：按指定 key 上传到对象存储
    const oss = getOssClient();
    if (oss.enabled) {
      try {
        const extension = path
          .extname(safeKey)
          .replace(/^\./, '')
          .toLowerCase();
        const res = await oss.putFile(
          filePath,
          this.ossKeyOfClientPath(safeKey),
          mimeOfExt(extension)
        );
        return res.url;
      } catch (err: any) {
        console.warn('[upload] OSS 上传失败，回退本地存储：', err?.message || err);
      }
    }

    const data = fs.readFileSync(filePath);

    // 构建目标路径
    const targetPath = path.join(basePath, dateDir, safeKey);
    const dirPath = path.dirname(targetPath);

    // 验证最终路径
    this.validateTargetPath(targetPath, basePath);

    // 如果文件夹不存在则创建
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(targetPath, data);
    return `${domain}/upload/${dateDir}/${safeKey}`;
  }

  /**
   * 上传文件
   * @param ctx
   * @param key 文件路径
   */
  async upload(ctx: any) {
    const { domain } = this.pluginInfo.config;
    try {
      const { key } = ctx.fields;
      const basePath = pUploadPath();
      const dateDir = moment().format('YYYYMMDD');

      // 验证key安全性
      let safeKey: string | undefined;
      if (key) {
        safeKey = this.sanitizePath(key);
      }

      if (_.isEmpty(ctx.files)) {
        throw new CoolCommException('上传文件为空');
      }

      const file = ctx.files[0];

      // 已配置 OSS：服务端上传到对象存储并返回公网 URL（前端 cl-upload 无感）
      const ossUrl = await this.uploadToOss(file, key);
      if (ossUrl) {
        return ossUrl;
      }

      // 安全处理原始文件名
      const originalFileName = path.basename(file.filename);
      const extension = originalFileName.split('.').pop();

      const finalName = safeKey || `${uuid()}.${extension}`;
      const name = `${dateDir}/${finalName}`;
      const target = path.join(basePath, name);

      // 验证最终路径
      this.validateTargetPath(target, basePath);

      const dirPath = path.join(basePath, dateDir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      const data = fs.readFileSync(file.data);
      fs.writeFileSync(target, data);
      return domain + '/upload/' + name;
    } catch (err) {
      console.error(err);
      if (err instanceof CoolCommException) {
        throw err;
      }
      throw new CoolCommException('上传失败: ' + err.message);
    }
  }
}

// 导出插件实例， Plugin名称不可修改
export const Plugin = CoolPlugin;
