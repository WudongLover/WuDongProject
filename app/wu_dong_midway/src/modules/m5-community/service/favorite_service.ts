import { Inject, Provide } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { FavoriteMapper } from '../mapper/favorite_mapper';
import { PostMapper } from '../mapper/post_mapper';
import { ProductService } from '../../m1-goods/service/product_service';
import { RestaurantService } from '../../m2-meal/service/restaurant_service';
import { HomestayService } from '../../m3-lodging/service/homestay_service';
import { TicketService } from '../../m4-ticket/service/ticket_service';
import { ApiError } from '../error/api_error';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource } from 'typeorm';
import { PostEntity } from '../entity/post_entity';

export interface FavoriteVo {
  id: string;
  targetType: string;
  name: string;
  cover: string;
  type: string;
  price?: number;
  targetId: string;
}

export interface ToggleBody {
  targetType: string;
  targetId: number;
}

@Provide()
export class FavoriteService {
  @Inject()
  favoriteMapper: FavoriteMapper;

  @Inject()
  postMapper: PostMapper;

  @Inject()
  productService: ProductService;

  @Inject()
  restaurantService: RestaurantService;

  @Inject()
  homestayService: HomestayService;

  @Inject()
  ticketService: TicketService;

  @InjectDataSource('default')
  dataSource: DataSource;

  async toggle(userId: number, body: ToggleBody): Promise<{ favorited: boolean }> {
    return this.favoriteMapper.toggle(userId, body.targetType, body.targetId);
  }

  async checkOne(userId: number, targetType: string, targetId: number): Promise<boolean> {
    return this.favoriteMapper.check(userId, targetType, targetId);
  }

  /** 当前用户全部收藏列表（聚合各模块名/封面） */
  async list(userId: number): Promise<FavoriteVo[]> {
    const rows = await this.favoriteMapper.listByUser(userId);
    const result: FavoriteVo[] = [];
    for (const row of rows) {
      const vo = await this.resolve(row.targetType, row.targetId);
      if (vo) result.push(vo);
    }
    return result;
  }

  private async resolve(targetType: string, targetId: number): Promise<FavoriteVo | null> {
    try {
      switch (targetType) {
        case 'GOODS':
        case 'SPECIALTY': {
          const p = await this.productService.detail(String(targetId));
          if (!p) return null;
          return {
            id: String(targetId),
            targetType,
            name: p.title,
            cover: p.cover ?? p.images?.[0] ?? '',
            type: targetType === 'GOODS' ? '非遗商品' : '特产',
            price: p.price,
            targetId: String(targetId),
          };
        }
        case 'RESTAURANT': {
          const r = await this.restaurantService.info(targetId);
          if (!r) return null;
          return {
            id: String(targetId),
            targetType,
            name: (r as any).name ?? '',
            cover: (r as any).cover ?? '',
            type: '餐厅',
            targetId: String(targetId),
          };
        }
        case 'HOMESTAY': {
          const h = await this.homestayService.info(String(targetId));
          if (!h) return null;
          return {
            id: String(targetId),
            targetType,
            name: (h as any).name ?? '',
            cover: (h as any).cover ?? '',
            type: '民宿',
            targetId: String(targetId),
          };
        }
        case 'ROUTE': {
          const rt = await this.ticketService.routeInfo(String(targetId));
          if (!rt) return null;
          return {
            id: String(targetId),
            targetType,
            name: rt.title ?? '',
            cover: rt.cover ?? '',
            type: '路线',
            price: rt.price,
            targetId: String(targetId),
          };
        }
        case 'POST': {
          const p = await this.postMapper.findPostById(targetId);
          if (!p) return null;
          return {
            id: String(targetId),
            targetType,
            name: p.title,
            cover: p.images?.[0] ?? '',
            type: '游记',
            targetId: String(targetId),
          };
        }
        default:
          return null;
      }
    } catch {
      return null;
    }
  }
}