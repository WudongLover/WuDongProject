import { ModuleConfig } from '@cool-midway/core';

/**
 * 模块配置 - m3 住（住宿）
 */
export default () => {
  return {
    // 模块名称
    name: 'm3-住宿模块',
    // 模块描述
    description: '民宿、房型、房态管理',
    // 中间件，只对本模块有效
    middlewares: [],
    // 中间件，全局有效
    globalMiddlewares: [],
    // 模块加载顺序，默认为0，值越大越优先加载
    order: 0,
  } as ModuleConfig;
};
