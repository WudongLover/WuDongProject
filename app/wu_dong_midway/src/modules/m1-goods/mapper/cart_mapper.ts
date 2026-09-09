import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CartItemEntity } from '../entity/cart_item_entity';

@Provide()
export class CartMapper {
  @InjectEntityModel(CartItemEntity)
  cartModel: Repository<CartItemEntity>;

  async list(userId: string) { return this.cartModel.find({ where: { userId, deletedAt: IsNull() }, order: { shopName: 'ASC', id: 'ASC' } }); }
  async findById(userId: string, id: string) { return this.cartModel.findOne({ where: { id, userId, deletedAt: IsNull() } }); }
  async findBySku(userId: string, skuId: string) { return this.cartModel.findOne({ where: { userId, skuId, deletedAt: IsNull() } }); }
  async save(item: CartItemEntity) { return this.cartModel.save(item); }
  async remove(item: CartItemEntity) { await this.cartModel.softRemove(item); }
}
