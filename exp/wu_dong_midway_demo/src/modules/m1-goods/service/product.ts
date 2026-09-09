import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Like, Repository } from 'typeorm';
import { ProductEntity } from '../entity/product';

/**
 * m1-goods 模块：商品/特产（骨架示例，表 wudong_m1_product）
 */
@Provide()
export class ProductService {
  @InjectEntityModel(ProductEntity)
  productModel: Repository<ProductEntity>;

  async page(query: any) {
    const page = Number(query.page) || 1;
    const size = Number(query.size) || 10;
    const where: any = {};
    if (query.module) {
      where.module = query.module;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.categoryId) {
      where.category_id = query.categoryId;
    }
    if (query.keyword) {
      where.title = Like(`%${query.keyword}%`);
    }
    const [list, total] = await this.productModel.findAndCount({
      where,
      order: { id: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });
    return { list, total, page, size };
  }

  async info(id: number | string) {
    return this.productModel.findOne({ where: { id: id as any } });
  }

  async add(body: Partial<ProductEntity>) {
    return this.productModel.save(this.productModel.create(body));
  }

  async update(body: any) {
    const { id, ...rest } = body;
    await this.productModel.update({ id }, rest);
    return this.info(id);
  }

  async remove(id: number | string) {
    await this.productModel.softDelete({ id: id as any });
    return { ok: true };
  }
}
