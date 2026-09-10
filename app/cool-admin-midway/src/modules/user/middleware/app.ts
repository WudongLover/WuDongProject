import { ALL, Config, Middleware } from '@midwayjs/core';
import { NextFunction, Context } from '@midwayjs/koa';
import { IMiddleware, Init, Inject } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import * as _ from 'lodash';
import { CoolCommException, CoolUrlTagData, TagTypes } from '@cool-midway/core';
import { Utils } from '../../../comm/utils';
import { WudongUserEntity } from '../entity/wudong-user';

/**
 * 用户
 */
@Middleware()
export class UserMiddleware implements IMiddleware<Context, NextFunction> {
  @Config(ALL)
  coolConfig;

  @Inject()
  coolUrlTagData: CoolUrlTagData;

  @Config('module.user.jwt')
  jwtConfig;

  @InjectEntityModel(WudongUserEntity)
  wudongUserEntity: Repository<WudongUserEntity>;

  ignoreUrls: string[] = [];

  @Config('koa.globalPrefix')
  prefix;

  @Inject()
  utils: Utils;

  @Init()
  async init() {
    this.ignoreUrls = this.coolUrlTagData.byKey(TagTypes.IGNORE_TOKEN, 'app');
  }

  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      let { url } = ctx;
      url = url.replace(this.prefix, '').split('?')[0];
      if (_.startsWith(url, '/app/')) {
        let token = ctx.get('Authorization');
        // 兼容标准 Authorization: Bearer <JWT>，也允许直接传裸 token（框架旧用法）
        if (token && token.startsWith('Bearer ')) {
          token = token.slice(7);
        }
        try {
          const payload: any = jwt.verify(token, this.jwtConfig.secret);
          if (payload.isRefresh) {
            throw new CoolCommException('登录失效~');
          }
          ctx.user = payload;
        } catch (error) {}
        // 使用matchUrl方法来检查URL是否应该被忽略
        const isIgnored = this.ignoreUrls.some(pattern =>
          this.utils.matchUrl(pattern, url)
        );
        if (isIgnored) {
          await next();
          return;
        } else {
          if (!ctx.user || !ctx.user.id) {
            ctx.status = 401;
            throw new CoolCommException('登录失效~');
          }
          const user = await this.wudongUserEntity.findOneBy({
            id: ctx.user.id,
          });
          if (!user || user.status !== 'ENABLED') {
            ctx.status = 401;
            throw new CoolCommException('登录失效或账号已被禁用~');
          }
          ctx.user = {
            ...ctx.user,
            id: String(user.id),
          };
        }
      }
      await next();
    };
  }
}
