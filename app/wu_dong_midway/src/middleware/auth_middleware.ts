import { Middleware, Inject, Provide } from '@midwayjs/core';
import { Context, NextFunction } from '@midwayjs/koa';
import { AuthService } from '../modules/user/service/auth_service';

/** C 端需要 access token 的用户接口（其余 /api/user/* 为开放接口） */
const TOKEN_REQUIRED_PATHS = [
  '/api/user/me',
  '/api/user/profile',
  '/api/user/password',
  '/api/favorites',
];
/** m2/m3/m4 的写操作需要登录，公开查询放行 */
const TOKEN_REQUIRED_WRITE_PREFIXES = ['/api/app/m2', '/api/app/m3', '/api/app/m4'];
/** 订单：读（我的订单）写都需要登录 */
const TOKEN_REQUIRED_ALL_PREFIXES = ['/api/app/order'];

/**
 * C 端鉴权中间件：
 * - 任何请求只要携带合法 Bearer token，都解析并写入 ctx.userId（可选鉴权，
 *   使公开 GET 也能识别登录用户，如帖子 liked 状态）；
 * - needToken 命中的接口（用户私有接口 + m3/m4/m5 写操作）无合法 token 时 401。
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

      const header = ctx.headers.authorization || '';
      const id = this.auth.verify(header.replace(/^Bearer\s+/i, ''));
      if (id) {
        (ctx as any).userId = id;
      } else if (needToken) {
        ctx.status = 401;
        ctx.body = { code: 1001, message: '未登录' };
        return;
      }
      await next();
    };
  }
}
