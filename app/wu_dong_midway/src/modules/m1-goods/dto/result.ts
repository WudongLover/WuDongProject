/**
 * 【m1-goods 模块】统一响应体（技术开发规范 7.2）
 *
 * 临时方案：统一响应体按 TODO.md 属 P1 公共后端交付物，wudong/common 尚未就绪，
 * 故先在本模块内自建轻量实现。P1 公共版本落地后，删除本文件并改为引用公共实现。
 */

/** 业务错误码（技术开发规范 7.3；71xx 段留给 m1 自有错误） */
export const ErrorCode = {
  /** 资源不存在 */
  NOT_FOUND: 1003,
} as const;

export interface ApiResult<T> {
  code: number;
  message: string;
  data: T | null;
}

/** 分页数据结构（规范 7.2：page / page_size 为 snake_case） */
export interface PageData<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
}

/** 成功响应 */
export function ok<T>(data: T): ApiResult<T> {
  return { code: 0, message: 'ok', data };
}

/** 业务失败响应 */
export function fail(code: number, message: string): ApiResult<null> {
  return { code, message, data: null };
}
