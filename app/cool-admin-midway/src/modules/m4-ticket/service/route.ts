import { CoolCommException } from '@cool-midway/core';
import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { M4RouteEntity } from '../entity/route';

export interface RoutePageQuery {
  page?: number | string;
  size?: number | string;
  keyword?: string;
  theme?: string;
  days?: number | string;
  status?: string;
  merchantId?: number | string;
}

export interface RouteAddPayload {
  merchantId?: number;
  title: string;
  cover: string;
  days?: number;
  theme?: string;
  price: number | string;
  sales?: number;
  rating?: number | string;
  departure?: string;
  includes?: string[];
  notice?: string[];
  status?: string;
}

@Provide()
export class M4RouteService {
  @InjectEntityModel(M4RouteEntity)
  routeEntity: Repository<M4RouteEntity>;

  async page(query: RoutePageQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const size = Math.min(100, Math.max(1, Number(query.size) || 10));
    const builder = this.routeEntity
      .createQueryBuilder('route')
      .orderBy('route.id', 'DESC');

    if (query.keyword?.trim()) {
      builder.andWhere('(route.title LIKE :keyword OR route.theme LIKE :keyword)', {
        keyword: `%${query.keyword.trim()}%`,
      });
    }
    if (query.theme?.trim()) builder.andWhere('route.theme = :theme', { theme: query.theme.trim() });
    if (query.days !== undefined && query.days !== '') builder.andWhere('route.days = :days', { days: Number(query.days) });
    if (query.status?.trim()) builder.andWhere('route.status = :status', { status: query.status.trim() });
    if (query.merchantId !== undefined && query.merchantId !== '') {
      builder.andWhere('route.merchant_id = :merchantId', { merchantId: Number(query.merchantId) });
    }

    const [list, total] = await builder
      .skip((page - 1) * size)
      .take(size)
      .getManyAndCount();
    return { list, total, page, size };
  }

  async info(id: number | string) {
    const route = await this.routeEntity.findOneBy({ id: Number(id) });
    if (!route) throw new CoolCommException('路线套餐不存在或已删除');
    return route;
  }

  async add(payload: RouteAddPayload) {
    if (!payload.title?.trim() || !payload.cover?.trim()) {
      throw new CoolCommException('路线标题和封面不能为空');
    }
    const days = Number(payload.days ?? 1);
    const price = Number(payload.price);
    const sales = Number(payload.sales ?? 0);
    const rating = Number(payload.rating ?? 5);
    if (
      !Number.isFinite(days) ||
      !Number.isFinite(price) ||
      !Number.isFinite(sales) ||
      !Number.isFinite(rating) ||
      days < 1 ||
      price < 0 ||
      sales < 0 ||
      rating < 0 ||
      rating > 5
    ) {
      throw new CoolCommException('天数、价格、销量和评分格式或范围不正确');
    }
    return this.routeEntity.save(
      this.routeEntity.create({
        merchantId: Number(payload.merchantId ?? 0),
        title: payload.title.trim(),
        cover: payload.cover.trim(),
        days,
        theme: payload.theme?.trim() || '',
        price: String(price),
        sales,
        rating: String(rating),
        departure: payload.departure?.trim() || '',
        includes: Array.isArray(payload.includes) ? payload.includes : [],
        notice: Array.isArray(payload.notice) ? payload.notice : [],
        status: payload.status?.trim() || 'ON_SHELF',
      })
    );
  }

  async remove(id: number | string) {
    await this.info(id);
    await this.routeEntity.softDelete(Number(id));
    return true;
  }
}
