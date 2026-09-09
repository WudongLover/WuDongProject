import 'dotenv/config';
import { MidwayConfig } from '@midwayjs/core';
// 实体显式注册（模块目录 src/modules/**/entity/*.ts → 表 wudong_{common|m1..m5}_*）
// 新增实体时在此追加一条 import + 数组项即可
import { UserEntity } from '../modules/user/entity/user';
import { OrderEntity } from '../modules/order/entity/order';
import { ProductEntity } from '../modules/m1-goods/entity/product';
import { RestaurantEntity } from '../modules/m2-meal/entity/restaurant';
import { HomestayEntity } from '../modules/m3-lodging/entity/homestay';
import { TicketEntity } from '../modules/m4-ticket/entity/ticket';
import { PostEntity } from '../modules/m5-community/entity/post';

/**
 * 通用配置（本地开发与生产一致）
 * 连接 MySQL wudong 业务库
 */
export default {
  // 各环境保持唯一即可（示例项目写死，接入正式环境时更换）
  keys: 'wu_dong_midway_demo_keys_2026',
  koa: {
    // exp 阶段演示端口 6665，迁入 app/wu_dong_midway 后由 .env 改为 8001
    port: Number(process.env.KOA_PORT) || 6665,
  },
  typeorm: {
    dataSource: {
      default: {
        type: 'mysql',
        host: process.env.MYSQL_HOST || '127.0.0.1',
        port: Number(process.env.MYSQL_PORT) || 3306,
        username: process.env.MYSQL_USERNAME || 'root',
        password: process.env.MYSQL_PASSWORD || '123321',
        database: process.env.MYSQL_DATABASE || 'wudong',
        charset: 'utf8mb4',
        timezone: '+08:00',
        // 表结构以 scripts/sql/wudong_schema.sql 为准，禁止自动同步
        synchronize: false,
        logging: true,
        // 实体：显式注册（见文件顶部 import）
        entities: [
          UserEntity,
          OrderEntity,
          ProductEntity,
          RestaurantEntity,
          HomestayEntity,
          TicketEntity,
          PostEntity,
        ],
      },
    },
  },
} as MidwayConfig;
