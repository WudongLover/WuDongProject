import { Configuration, App } from '@midwayjs/core';
import * as koa from '@midwayjs/koa';
import * as orm from '@midwayjs/typeorm';
import DefaultConfig from './config/config.default';

@Configuration({
  imports: [koa, orm],
  importConfigs: [{ default: DefaultConfig }],
})
export class MainConfiguration {
  @App()
  app: koa.Application;

  async onReady() {}
}
