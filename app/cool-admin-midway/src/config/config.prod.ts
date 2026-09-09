import 'dotenv/config';
import { CoolConfig } from '@cool-midway/core';
import { MidwayConfig } from '@midwayjs/core';
import { entities } from '../entities';
import { TenantSubscriber } from '../modules/base/db/tenant';

/**
 * 本地开发 npm run prod 读取的配置文件
 */
export default {
  typeorm: {
    dataSource: {
      default: {
        type: 'mysql',
        host: process.env.MYSQL_HOST || '127.0.0.1',
        port: Number(process.env.MYSQL_PORT) || 3306,
        username: process.env.MYSQL_USERNAME || 'root',
        password: process.env.MYSQL_PASSWORD || '123456',
        database: process.env.MYSQL_DATABASE || 'cool',
        // 自动建表 注意：线上部署的时候不要使用，有可能导致数据丢失
        // Docker 本地环境可通过 MYSQL_SYNCHRONIZE=true 初始化新数据库，生产默认关闭
        synchronize: process.env.MYSQL_SYNCHRONIZE === 'true',
        // 打印日志
        logging: false,
        // 字符集
        charset: 'utf8mb4',
        // 是否开启缓存
        cache: true,
        // 实体路径
        entities,
        // 订阅者
        subscribers: [TenantSubscriber],
      },
    },
  },
  cool: {
    // 实体与路径，跟生成代码、前端请求、swagger文档相关 注意：线上不建议开启，以免暴露敏感信息
    eps: false,
    // 是否自动导入模块数据库
    initDB: process.env.COOL_INIT_DB === 'true',
    // 判断是否初始化的方式
    initJudge: 'db',
    // 是否自动导入模块菜单
    initMenu: process.env.COOL_INIT_MENU === 'true',
  } as CoolConfig,
} as MidwayConfig;
