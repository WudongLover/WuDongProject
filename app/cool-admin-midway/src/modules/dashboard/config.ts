import { ModuleConfig } from '@cool-midway/core';

/**
 * 乌东文旅运营数据看板
 */
export default (): ModuleConfig => {
  return {
    name: '乌东数据看板',
    description: '衣·非遗 / 食·风味 / 住·山居 / 行·山水 / 社区 / 用户的运营统计接口',
    order: 9,
  };
};
