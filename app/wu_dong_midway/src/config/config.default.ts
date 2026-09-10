import 'dotenv/config';
import { MidwayConfig } from '@midwayjs/core';
import { PostEntity } from '../modules/m5-community/entity/post_entity';
import { CommentEntity } from '../modules/m5-community/entity/comment_entity';
import { PostLikeEntity } from '../modules/m5-community/entity/post_like_entity';
import { UserEntity } from '../modules/m5-community/entity/user_entity';
import { ProductEntity } from '../modules/m1-goods/entity/product_entity';
import { SkuEntity } from '../modules/m1-goods/entity/sku_entity';
import { CategoryEntity } from '../modules/m1-goods/entity/category_entity';
import { ReviewEntity } from '../modules/m1-goods/entity/review_entity';
import { CartItemEntity } from '../modules/m1-goods/entity/cart_item_entity';
import { HomestayEntity } from '../modules/m3-lodging/entity/homestay_entity';
import { RoomTypeEntity } from '../modules/m3-lodging/entity/room_type_entity';
import { RoomCalendarEntity } from '../modules/m3-lodging/entity/room_calendar_entity';
import { TicketEntity } from '../modules/m4-ticket/entity/ticket_entity';
import { ScenicEntity } from '../modules/m4-ticket/entity/scenic_entity';
import { RouteEntity } from '../modules/m4-ticket/entity/route_entity';
import { RouteDayEntity } from '../modules/m4-ticket/entity/route_day_entity';
import { RefreshTokenEntity } from '../modules/user/entity/refresh_token_entity';
import { OrderEntity } from '../modules/order/entity/order_entity';
import { PaymentEntity } from '../modules/order/entity/payment_entity';
import { RestaurantEntity } from '../modules/m2-meal/entity/restaurant_entity';
import { DishEntity } from '../modules/m2-meal/entity/dish_entity';
import { TimeSlotEntity } from '../modules/m2-meal/entity/time_slot_entity';
import { MealOrderExtEntity } from '../modules/m2-meal/entity/order_ext_entity';
import { LodgingOrderExtEntity } from '../modules/m3-lodging/entity/order_ext_entity';
// user 模块（C 端鉴权）实体：与 m5 的临时只读实体同表不同用途，二者都要注册，
// 否则 AuthService 注入的 UserEntity 没有 metadata，登录接口直接 500
import { UserEntity as AuthUserEntity } from '../modules/user/entity/user_entity';

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
    // 端口由 .env 的 KOA_PORT 控制，默认 6666
    port: Number(process.env.KOA_PORT) || 6666,
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
          PostEntity,
          CommentEntity,
          PostLikeEntity,
          UserEntity,
          ProductEntity,
          SkuEntity,
          CategoryEntity,
          ReviewEntity,
          CartItemEntity,
          HomestayEntity, RoomTypeEntity, RoomCalendarEntity,
          TicketEntity, ScenicEntity, RouteEntity, RouteDayEntity,
          RefreshTokenEntity,
          AuthUserEntity,
          OrderEntity,
          PaymentEntity,
          RestaurantEntity,
          DishEntity,
          TimeSlotEntity,
          MealOrderExtEntity,
          LodgingOrderExtEntity,
        ],
      },
    },
  },
} as MidwayConfig;
