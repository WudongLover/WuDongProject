import 'dotenv/config';
import { CoolConfig } from '@cool-midway/core';
import { MidwayConfig } from '@midwayjs/core';
import { TenantSubscriber } from '../modules/base/db/tenant';

/**
 * 本地开发 npm run dev 读取的配置文件
 */
export default {
  typeorm: {
    dataSource: {
      default: {
        type: 'mysql',
        host: process.env.MYSQL_HOST || '127.0.0.1',
        port: Number(process.env.MYSQL_PORT) || 3306,
        username: process.env.MYSQL_USERNAME || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'cool',
        // 自动建表：必须保持 false，否则会改动 C 端共用的业务库。
        // 本库与 C 端是同一个（.env 的 MYSQL_DATABASE=wudong），而下面的 entities 是
        // glob 扫描 '**/modules/*/entity'，会把本服务声明的 wudong_common_order /
        // wudong_common_payment / wudong_common_order_event 一并纳入同步；
        // synchronize 会把这些共享表对齐到本服务的实体，直接 DROP 掉实体里没声明的列。
        // 已发生过一次：checkout_id、completed_at、callback_payload、retry_count、
        // next_retry_at 被删，导致 C 端下单接口全部 500。
        // 表结构变更请走 migration（与 CLAUDE.md 的约定一致）。
        synchronize: false,
        // 打印日志
        logging: false,
        // 字符集
        charset: 'utf8mb4',
        // 是否开启缓存
        cache: true,
        // 实体路径
        entities: ['**/modules/*/entity'],
        // 订阅者
        subscribers: [TenantSubscriber],
      },
    },
  },
  cool: {
    // 实体与路径，跟生成代码、前端请求、swagger文档相关 注意：线上不建议开启，以免暴露敏感信息
    eps: true,
    // 是否自动导入模块数据库
    initDB: true,
    // 判断是否初始化的方式
    initJudge: 'db',
    // 是否自动导入模块菜单
    initMenu: true,
  } as CoolConfig,
} as MidwayConfig;
