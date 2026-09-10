import { Middleware, Inject, Provide } from '@midwayjs/core';
import { Context, NextFunction } from '@midwayjs/koa';
import { AuthService } from '../modules/user/service/auth_service';

/** C 端需要 access token 的用户接口（其余 /api/user/* 为开放接口） */
const TOKEN_REQUIRED_PATHS = [
  '/api/user/me',
  '/api/user/profile',
  '/api/user/password',
];
/** m3/m4 的写操作需要登录，公开查询放行 */
const TOKEN_REQUIRED_WRITE_PREFIXES = ['/api/app/m3', '/api/app/m4'];
/**
 * 写操作前缀内的豁免：订单链路允许匿名下单。
 * C 端预订页没有登录门槛（未登录也能走到「立即预订」），订单接口的身份
 * 由 OrderController 按 x-user-id → DEMO_USER_ID 解析，与 m1 购物车、m5 社区同一套约定。
 * 若日后要求下单必须登录，删掉本常量即可——届时前端需同步补 Authorization 头。
 */
const TOKEN_EXEMPT_PREFIXES = ['/api/app/m4/order'];

/**
 * 段边界匹配：命中前缀本身或其子路径。
 * 直接用 startsWith 会让 `/api/app/m4/order-xxx` 这类同前缀路由被误放行。
 */
function matchesPrefix(path: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

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
          matchesPrefix(path, TOKEN_REQUIRED_WRITE_PREFIXES) &&
          !matchesPrefix(path, TOKEN_EXEMPT_PREFIXES));

      if (needToken) {
        const header = ctx.headers.authorization || '';
        const id = this.auth.verify(header.replace(/^Bearer\s+/i, ''));
        if (!id) {
          ctx.status = 401;
          ctx.body = { code: 1001, message: '未登录' };
          return;
        }
        // Koa 的 Context 没有 userId 字段，扩展它而不是退化成 any
        (ctx as unknown as { userId?: string }).userId = id;
      }
      await next();
    };
  }
}
