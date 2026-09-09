/**
 * 【m5-community 模块】业务错误
 * 与前端契约一致：HTTP 4xx + body { code, message }
 * code 复用/对齐前端 ApiError：1000 参数错误 / 1003 资源不存在 / 1004 校验失败
 */
export class ApiError extends Error {
  code: number;
  httpCode: number;

  constructor(code: number, message: string, httpCode = 400) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.httpCode = httpCode;
  }
}
