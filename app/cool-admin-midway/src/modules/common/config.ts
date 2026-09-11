import { ModuleConfig } from '@cool-midway/core';

/**
 * 模块配置 - 乌东内容运营（管理端可编辑的文化推文等）
 */
export default () => {
  return {
    // 模块名称
    name: '乌东内容运营',
    // 模块描述
    description: '文化推文等内容的编写与发布',
    // 中间件，只对本模块有效
    middlewares: [],
    // 中间件，全局有效
    globalMiddlewares: [],
    // 模块加载顺序，默认为0，值越大越优先加载
    order: 10,
  } as ModuleConfig;
};
