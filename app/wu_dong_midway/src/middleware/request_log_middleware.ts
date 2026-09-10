/**
 * 全局请求日志中间件：记录每一次 HTTP 请求的方法、路径、状态码与耗时
 */
import { Middleware, Provide } from '@midwayjs/core';
import { Context, NextFunction } from '@midwayjs/koa';

@Provide()
@Middleware()
export class RequestLogMiddleware {
  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      const start = Date.now();
      try {
        await next();
      } finally {
        const cost = Date.now() - start;
        ctx.logger.info(`[请求日志] ${ctx.method} ${ctx.url} -> ${ctx.status} (${cost}ms)`);
      }
    };
  }
}
