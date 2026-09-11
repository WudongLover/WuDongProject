/**
 * 阿里云 OSS 工具类（乌东文旅 · C 端后端）
 *
 * 定位：项目中所有照片（社区配图、头像、商品/民宿/门票封面等）的对象存储底座。
 * 约定：
 * - bucket 公共读，上传后直接返回 `https://{bucket}.{endpoint}/{key}`，绑定自定义域名时改用 OSS_PUBLIC_BASE_URL；
 * - 配置全部来自 .env，未配置时 enabled() 为 false，由调用方决定返回业务错误还是降级本地存储；
 * - 对象键规则 `{OSS_PREFIX}/{scene}/{yyyyMM}/{uuid}.{ext}`，只接受图片 MIME。
 *
 * 与 cool-admin-midway/src/comm/oss.ts 保持同一套 API 与环境变量名（两个后端无法共享代码，各自维护一份）。
 */
import OSS = require('ali-oss');
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { Readable } from 'stream';

/** 允许上传的图片 MIME → 扩展名 */
export const IMAGE_MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/** 扩展名 → MIME（上传本地文件时推断 Content-Type） */
export const IMAGE_EXT_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

/** 单张图片大小上限：10MB */
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

/** 上传结果：对象键 + 公网访问地址 */
export interface OssPutResult {
  key: string;
  url: string;
}

/** OSS 配置（来源于 .env） */
export interface OssConfig {
  /** 配置是否完备（缺 bucket 或 AK/SK 即视为未启用） */
  enabled: boolean;
  /** 地域，如 oss-cn-guizhou；未填时可只配 OSS_ENDPOINT */
  region: string;
  bucket: string;
  accessKeyId: string;
  accessKeySecret: string;
  /** 访问域名，默认 `oss-{region}.aliyuncs.com`，可填内网域名或自定义 endpoint */
  endpoint: string;
  /** 公网访问前缀，绑了 CDN/自定义域名后填写；留空则用 `https://{bucket}.{endpoint}` */
  publicBaseUrl: string;
  /** 对象键前缀，默认 wudong（同一 bucket 内区分项目） */
  prefix: string;
  /** 临时授权 token（STS），一般留空 */
  stsToken?: string;
}

function readEnv(key: string): string {
  return (process.env[key] || '').trim();
}

/** 去掉结尾斜杠 */
function trimSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

/** 规范化访问域名：允许 .env 里带 https:// 前缀 */
function normalizeEndpoint(endpoint: string): string {
  return trimSlash(endpoint.replace(/^https?:\/\//i, ''));
}

/** 读取 .env 中的 OSS 配置 */
export function readOssConfig(): OssConfig {
  const region = readEnv('OSS_REGION');
  const bucket = readEnv('OSS_BUCKET');
  const accessKeyId = readEnv('OSS_ACCESS_KEY_ID');
  const accessKeySecret = readEnv('OSS_ACCESS_KEY_SECRET');
  const rawEndpoint = readEnv('OSS_ENDPOINT');
  const endpoint = rawEndpoint
    ? normalizeEndpoint(rawEndpoint)
    : region
      ? `oss-${region.replace(/^oss-/, '')}.aliyuncs.com`
      : '';

  return {
    enabled: !!(bucket && accessKeyId && accessKeySecret && (endpoint || region)),
    region,
    bucket,
    accessKeyId,
    accessKeySecret,
    endpoint,
    publicBaseUrl: trimSlash(readEnv('OSS_PUBLIC_BASE_URL')),
    prefix: trimSlash(readEnv('OSS_PREFIX')) || 'wudong',
    stsToken: readEnv('OSS_STS_TOKEN') || undefined,
  };
}

/** MIME 是否在图片白名单内 */
export function isImageMime(mime?: string | null): boolean {
  if (!mime) {
    return false;
  }
  return !!IMAGE_MIME_EXT[String(mime).toLowerCase().split(';')[0].trim()];
}

/** 图片 MIME → 扩展名（非白名单返回空串） */
export function extFromMime(mime?: string | null): string {
  if (!mime) {
    return '';
  }
  return IMAGE_MIME_EXT[String(mime).toLowerCase().split(';')[0].trim()] || '';
}

/** 从文件名/URL 推断图片扩展名（非白名单返回空串） */
export function extFromName(nameOrUrl?: string | null): string {
  if (!nameOrUrl) {
    return '';
  }
  const clean = String(nameOrUrl).split('?')[0].split('#')[0];
  const ext = path.extname(clean).replace(/^\./, '').toLowerCase();
  return IMAGE_EXT_MIME[ext] ? ext : '';
}

/** 从文件名/URL 推断图片 MIME（非白名单返回空串） */
export function mimeFromName(nameOrUrl?: string | null): string {
  const ext = extFromName(nameOrUrl);
  return ext ? IMAGE_EXT_MIME[ext] : '';
}

/** 仅保留场景名中的安全字符，避免出现非法对象键 */
function safeScene(scene?: string): string {
  const value = String(scene || 'misc')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return value || 'misc';
}

/** 拼接公网访问地址 */
export function publicUrlOf(config: OssConfig, key: string): string {
  const base = config.publicBaseUrl || `https://${config.bucket}.${config.endpoint}`;
  return `${trimSlash(base)}/${String(key).replace(/^\/+/, '')}`;
}

/**
 * OSS 客户端封装：图片上传 / 删除 / 查询 / 签名 URL。
 * 未配置时构造不会抛错，只有真正调用 OSS 的方法才会抛（先调 assertEnabled）。
 */
export class OssClient {
  readonly config: OssConfig;
  private client: OSS | null = null;

  constructor(config: OssConfig = readOssConfig()) {
    this.config = config;
  }

  /** 是否已配置可用 */
  get enabled(): boolean {
    return this.config.enabled;
  }

  /** 未配置时抛出可读错误，供业务侧转成提示 */
  assertEnabled(): void {
    if (!this.enabled) {
      throw new Error(
        'OSS 未配置：请在 .env 中填写 OSS_REGION / OSS_BUCKET / OSS_ACCESS_KEY_ID / OSS_ACCESS_KEY_SECRET'
      );
    }
  }

  /** 生成对象键：{prefix}/{scene}/{yyyyMM}/{uuid}.{ext} */
  buildKey(scene: string, filenameOrExt: string): string {
    const ext = extFromName(filenameOrExt) || extFromName(`.${filenameOrExt}`);
    const suffix = ext || 'jpg';
    const now = new Date();
    const yyyyMM = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const id = randomUUID().replace(/-/g, '');
    const segments = [this.config.prefix, safeScene(scene), yyyyMM].filter(Boolean);
    return `${segments.join('/')}/${id}.${suffix}`;
  }

  /** 上传 Buffer */
  async putBuffer(buffer: Buffer, key: string, mime?: string): Promise<OssPutResult> {
    this.assertEnabled();
    const res = await this.getClient().put(key, buffer, mime ? { mime } : {});
    return { key: res.name || key, url: this.getPublicUrl(res.name || key) };
  }

  /** 上传本地文件 */
  async putFile(localPath: string, key: string, mime?: string): Promise<OssPutResult> {
    this.assertEnabled();
    const data = fs.readFileSync(localPath);
    return this.putBuffer(data, key, mime || mimeFromName(localPath) || undefined);
  }

  /** 上传流（ali-oss 要求流式上传显式给出 size） */
  async putStream(
    stream: Readable,
    key: string,
    options: { mime?: string; size: number }
  ): Promise<OssPutResult> {
    this.assertEnabled();
    // @types/ali-oss 把 timeout / meta / callback 标成必填，实际运行时均可省略
    const putOptions = {
      contentLength: options.size,
      mime: options.mime,
    } as unknown as OSS.PutStreamOptions;
    const res = await this.getClient().putStream(key, stream, putOptions);
    return { key: res.name || key, url: this.getPublicUrl(res.name || key) };
  }

  /** 对象是否存在（404 视为不存在，其他错误抛出） */
  async exists(key: string): Promise<boolean> {
    this.assertEnabled();
    try {
      await this.getClient().head(key);
      return true;
    } catch (err: any) {
      const status = err?.status ?? err?.statusCode;
      if (status === 404 || err?.code === 'NoSuchKey' || err?.code === 'NotFound') {
        return false;
      }
      throw err;
    }
  }

  /** 删除单个对象 */
  async delete(key: string): Promise<void> {
    this.assertEnabled();
    await this.getClient().delete(key);
  }

  /** 批量删除（自动按 1000 个一批） */
  async deleteMany(keys: string[]): Promise<void> {
    this.assertEnabled();
    const list = keys.filter(Boolean);
    for (let i = 0; i < list.length; i += 1000) {
      await this.getClient().deleteMulti(list.slice(i, i + 1000), { quiet: true });
    }
  }

  /** 列举对象（单页，最多 1000 条） */
  async list(prefix: string, maxKeys = 100): Promise<{ name: string; size: number }[]> {
    this.assertEnabled();
    const res = await this.getClient().list({ prefix, 'max-keys': maxKeys }, {});
    return (res.objects || []).map((item: any) => ({
      name: item.name,
      size: item.size,
    }));
  }

  /** 公网访问地址（公共读） */
  getPublicUrl(key: string): string {
    return publicUrlOf(this.config, key);
  }

  /** 签名地址（预留私有桶 / 防盗链场景，默认 1 小时） */
  getSignedUrl(key: string, expires = 3600): string {
    this.assertEnabled();
    return this.getClient().signatureUrl(key, { expires });
  }

  /** 懒加载 ali-oss 客户端，避免未配置时构造报错 */
  private getClient(): OSS {
    if (!this.client) {
      const { region, bucket, accessKeyId, accessKeySecret, endpoint, stsToken } =
        this.config;
      this.client = new OSS({
        region: region || undefined,
        bucket,
        accessKeyId,
        accessKeySecret,
        endpoint: endpoint || undefined,
        stsToken,
        secure: true,
      });
    }
    return this.client;
  }
}

let singleton: OssClient | null = null;

/** 单例（首次调用时读取 .env） */
export function getOssClient(): OssClient {
  if (!singleton) {
    singleton = new OssClient();
  }
  return singleton;
}

/** 重置单例（测试或配置热更新时使用） */
export function resetOssClient(): void {
  singleton = null;
}

/** 便捷判断：OSS 是否可用 */
export function isOssEnabled(): boolean {
  return getOssClient().enabled;
}
