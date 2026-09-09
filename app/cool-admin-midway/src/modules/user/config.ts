import { ModuleConfig } from '@cool-midway/core';
import { UserMiddleware } from './middleware/app';

/**
 * 模块配置
 */
export default () => {
  return {
    // 模块名称
    name: '用户模块',
    // 模块描述
    description: 'APP、小程序、公众号等用户',
    // 中间件，只对本模块有效
    middlewares: [],
    // 中间件，全局有效
    globalMiddlewares: [UserMiddleware],
    // 模块加载顺序，默认为0，值越大越优先加载
    order: 0,
    // 短信
    sms: {
      // 验证码有效期，单位秒
      timeout: 60 * 3,
      // 同手机号发送间隔，单位秒
      throttle: 60,
    },
    // C 端认证
    auth: {
      // 刷新令牌 Cookie 名称
      refreshCookie: 'wudong_refresh',
      // 开发环境 http 为 false；生产 https 需改为 true
      cookieSecure: false,
    },
    // jwt
    jwt: {
      // token 过期时间，单位秒
      expire: 60 * 60 * 2,
      // 刷新token 过期时间，单位秒
      refreshExpire: 60 * 60 * 24 * 30,
      // jwt 秘钥
      secret: process.env.JWT_SECRET || 'wudong-login-dev-secret',
    },
  } as ModuleConfig;
};
