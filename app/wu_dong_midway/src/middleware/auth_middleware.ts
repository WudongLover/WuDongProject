import { Middleware, Inject, Provide } from '@midwayjs/core';
import { Context, NextFunction } from '@midwayjs/koa';
import { AuthService } from '../modules/user/service/auth_service';

/** C 端需要 access token 的用户接口（其余 /api/user/* 为开放接口） */
const TOKEN_REQUIRED_PATHS = [
  '/api/user/me',
  '/api/user/profile',
  '/api/user/password',
];
/** m2/m3/m4 的写操作需要登录，公开查询放行 */
const TOKEN_REQUIRED_WRITE_PREFIXES = ['/api/app/m2', '/api/app/m3', '/api/app/m4'];
/** 订单：读（我的订单）写都需要登录 */
const TOKEN_REQUIRED_ALL_PREFIXES = ['/api/app/order'];

/**
 * C 端鉴权中间件：校验 Authorization: Bearer <access token>，通过后写入 ctx.userId
 */
@Provide()
@Middleware()
export class AuthMiddleware {
  @Inject()
  auth: AuthService;

  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      const path = ctx.path;
      const needToken =
        TOKEN_REQUIRED_PATHS.includes(path) ||
        (ctx.method !== 'GET' &&
          TOKEN_REQUIRED_WRITE_PREFIXES.some((prefix) =>
            path.startsWith(prefix)
          )) ||
        TOKEN_REQUIRED_ALL_PREFIXES.some((prefix) => path.startsWith(prefix));

      if (needToken) {
        const header = ctx.headers.authorization || '';
        const id = this.auth.verify(header.replace(/^Bearer\s+/i, ''));
        if (!id) {
          ctx.status = 401;
          ctx.body = { code: 1001, message: '未登录' };
          return;
        }
        (ctx as any).userId = id;
      }
      await next();
    };
  }
}
