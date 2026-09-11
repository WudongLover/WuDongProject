import { Configuration, App } from '@midwayjs/core';
import * as koa from '@midwayjs/koa';
import * as orm from '@midwayjs/typeorm';
import * as upload from '@midwayjs/upload';
import * as validate from '@midwayjs/validate';
import DefaultConfig from './config/config.default';
import { ApiErrorFilter } from './filter/api_error_filter';
import { RequestLogMiddleware } from './middleware/request_log_middleware';
import { AuthMiddleware } from './middleware/auth_middleware';

@Configuration({
  imports: [koa, orm, upload, validate],
  importConfigs: [{ default: DefaultConfig }],
})
export class MainConfiguration {
  @App()
  app: koa.Application;

  async onReady() {
    // 请求日志：记录每一次 HTTP 请求
    this.app.useMiddleware([RequestLogMiddleware, AuthMiddleware]);
    // 业务错误统一出口：ApiError → { code, message }
    this.app.useFilter([ApiErrorFilter]);
  }
}
