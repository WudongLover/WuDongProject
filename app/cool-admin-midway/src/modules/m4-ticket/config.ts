import { ModuleConfig } from '@cool-midway/core';

export default () =>
  ({
    name: '行模块',
    description: 'C端门票与路线套餐',
    middlewares: [],
    globalMiddlewares: [],
    order: 0,
  }) as ModuleConfig;
