import { Inject, Provide } from '@midwayjs/core';
import { FindOptionsWhere, Like } from 'typeorm';
import { ProductEntity } from '../entity/product_entity';
import { ProductMapper } from '../mapper/product_mapper';

/**
 * 【m1-goods 模块】商品业务逻辑（衣 GOODS / 食特产 SPECIALTY 通用）
 */
@Provide()
export class ProductService {
  @Inject()
  mapper!: ProductMapper;

  /**
   * 分页查询（支持 module / keyword / status / categoryId 过滤）
   * 特产场景传 module=SPECIALTY，衣传 module=GOODS；不传则返回全部
   */
  async page(query: any) {
    const page = Number(query.page) || 1;
    const pageSize = Math.min(Number(query.pageSize) || 20, 100);
    const where: FindOptionsWhere<ProductEntity> = {};
    if (query.module) {
      where.module = query.module;
    }
    if (query.keyword) {
      where.title = Like(`%${query.keyword}%`);
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.categoryId) {
      where.categoryId = Number(query.categoryId);
    }
    const { list, total } = await this.mapper.page(page, pageSize, where);
    return { list, total, page, pageSize };
  }

  /**
   * 单点查询
   */
  async info(id: number) {
    const entity = await this.mapper.findById(id);
    if (!entity) {
      throw new Error('商品不存在');
    }
    return entity;
  }

  /**
   * 新增（module 默认 SPECIALTY；categoryId/merchantId 接入前 mock 0）
   */
  async add(body: any) {
    const entity = new ProductEntity();
    entity.module = body.module || 'SPECIALTY';
    entity.title = body.title;
    entity.cover = body.cover;
    if (body.subtitle !== undefined) entity.subtitle = body.subtitle;
    if (body.price !== undefined) entity.price = body.price;
    if (body.marketPrice !== undefined) entity.marketPrice = body.marketPrice;
    if (body.stock !== undefined) entity.stock = body.stock;
    if (body.images !== undefined) entity.images = body.images;
    if (body.detail !== undefined) entity.detail = body.detail;
    if (body.craft !== undefined) entity.craft = body.craft;
    if (body.artisan !== undefined) entity.artisan = body.artisan;
    if (body.origin !== undefined) entity.origin = body.origin;
    if (body.shelfLife !== undefined) entity.shelfLife = body.shelfLife;
    entity.status = body.status || 'ON_SHELF';
    entity.categoryId = Number(body.categoryId) || 0;
    entity.merchantId = 0;
    return this.mapper.save(entity);
  }

  /**
   * 逻辑删除
   */
  async delete(id: number) {
    const result = await this.mapper.softDelete(id);
    return { affected: result.affected };
  }
}