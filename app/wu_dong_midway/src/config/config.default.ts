import 'dotenv/config';
import { MidwayConfig } from '@midwayjs/core';
import { PostEntity } from '../modules/m5-community/entity/post_entity';
import { CommentEntity } from '../modules/m5-community/entity/comment_entity';
import { PostLikeEntity } from '../modules/m5-community/entity/post_like_entity';
import { UserEntity } from '../modules/m5-community/entity/user_entity';
import { ProductEntity } from '../modules/m1-goods/entity/product_entity';
import { SkuEntity } from '../modules/m1-goods/entity/sku_entity';
import { CartItemEntity } from '../modules/m1-goods/entity/cart_item_entity';

/**
 * 通用配置（本地开发与生产一致）
 * 连接 MySQL wudong 业务库
 *
 * 实体显式注册约定：src/modules 下各模块 entity 目录内的 *_entity.ts → 表 wudong_{common|m1..m5}_*
 * 各模块填充 entity 后，在此追加 import + 加入 entities 数组
 */
export default {
  // 各环境保持唯一即可（正式接入时更换）
  keys: 'wu_dong_midway_keys_2026',
  koa: {
    port: Number(process.env.KOA_PORT) || 8001,
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
        entities: [PostEntity, CommentEntity, PostLikeEntity, UserEntity, ProductEntity, SkuEntity, CartItemEntity],
      },
    },
  },
} as MidwayConfig;
