/**
 * 【m1-goods 模块】购物车（wudong_common_cart_item）
 * mapper 层：数据访问（封装 Repository / SQL，Service 只依赖本文件）
 */
import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CartItemEntity } from '../entity/cart_item_entity';

@Provide()
export class CartMapper {
  @InjectEntityModel(CartItemEntity)
  cartModel: Repository<CartItemEntity>;

  /** 当前用户购物车项（按店铺分组展示顺序：店铺名 + 加入时间） */
  async list(userId: string): Promise<CartItemEntity[]> {
    return this.cartModel.find({
      where: { userId, deletedAt: IsNull() },
      order: { shopName: 'ASC', id: 'ASC' },
    });
  }

  /** 按购物车项主键查（仅限本人） */
  async findById(userId: string, id: string): Promise<CartItemEntity | null> {
    return this.cartModel.findOne({ where: { id, userId, deletedAt: IsNull() } });
  }

  /**
   * 同商品同 SKU 合并数量用（DDL：uk_user_sku）。
   * 唯一键不含 deleted_at，软删除行仍占用键位，因此必须连已删除行一起查，
   * 命中后由 service 恢复该行（清 deleted_at）并覆盖数量，避免重复加购报唯一键冲突。
   */
  async findBySku(userId: string, skuId: string): Promise<CartItemEntity | null> {
    return this.cartModel.findOne({ where: { userId, skuId }, withDeleted: true });
  }

  async save(item: CartItemEntity): Promise<CartItemEntity> {
    return this.cartModel.save(item);
  }

  /** 软删除单条购物车项 */
  async remove(item: CartItemEntity): Promise<void> {
    await this.cartModel.softRemove(item);
  }
}
