/**
 * 全局业务错误过滤器：捕获 ApiError，输出与前端契约一致的 { code, message }
 */
import { Catch, Provide } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { ApiError } from '../modules/m5-community/error/api_error';

@Provide()
@Catch(ApiError)
export class ApiErrorFilter {
  async catch(err: ApiError, ctx: Context) {
    ctx.status = err.httpCode;
    ctx.body = { code: err.code, message: err.message };
  }
}
