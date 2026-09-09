import { Inject, Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { ApiError } from '../../m5-community/error/api_error';
import { CartMapper } from '../mapper/cart_mapper';
import { CartItemEntity } from '../entity/cart_item_entity';
import { ProductEntity } from '../entity/product_entity';
import { SkuEntity } from '../entity/sku_entity';

export interface AddCartPayload { productId: string; skuId?: string; qty?: number; shop?: string; }

@Provide()
export class CartService {
  @Inject() cartMapper: CartMapper;
  @InjectEntityModel(ProductEntity) productModel: Repository<ProductEntity>;
  @InjectEntityModel(SkuEntity) skuModel: Repository<SkuEntity>;
  async list(userId: string) { return (await this.cartMapper.list(userId)).map(item => this.toVo(item)); }
  async add(userId: string, payload: AddCartPayload) {
    const product = await this.productModel.findOne({ where: { id: String(payload.productId), status: 'ON_SHELF' } });
    if (!product) throw new ApiError(1003, '商品不存在或已下架', 404);
    const skuId = String(payload.skuId || '0');
    const sku = skuId !== '0' ? await this.skuModel.findOne({ where: { id: skuId, productId: product.id } }) : null;
    if (skuId !== '0' && !sku) throw new ApiError(1003, '商品规格不存在', 404);
    const stock = sku?.stock ?? product.stock;
    const qty = Number(payload.qty ?? 1);
    if (!Number.isInteger(qty) || qty < 1) throw new ApiError(1004, '数量必须是正整数');
    const existing = await this.cartMapper.findBySku(userId, skuId);
    const nextQty = (existing?.qty ?? 0) + qty;
    if (nextQty > stock) throw new ApiError(3002, `库存不足，最多可购买 ${stock} 件`);
    const item = existing || new CartItemEntity();
    Object.assign(item, { userId, productId: product.id, skuId, merchantId: product.merchantId, qty: nextQty, checked: existing?.checked ?? true, title: product.title, cover: product.cover, skuName: sku?.name || '默认规格', price: sku?.price ?? product.price, stock, shopName: payload.shop || (product.module === 'SPECIALTY' ? '乌东特产合作社' : '乌东非遗工坊') });
    await this.cartMapper.save(item);
    return this.list(userId);
  }
  async update(userId: string, id: string, patch: { qty?: number; checked?: boolean }) {
    const item = await this.cartMapper.findById(userId, id);
    if (!item) throw new ApiError(1003, '购物车商品不存在', 404);
    if (patch.qty !== undefined) { const qty = Number(patch.qty); if (!Number.isInteger(qty) || qty < 1 || qty > item.stock) throw new ApiError(3002, `库存不足，最多可购买 ${item.stock} 件`); item.qty = qty; }
    if (patch.checked !== undefined) item.checked = Boolean(patch.checked);
    await this.cartMapper.save(item);
    return this.list(userId);
  }
  async remove(userId: string, id: string) { const item = await this.cartMapper.findById(userId, id); if (item) await this.cartMapper.remove(item); return this.list(userId); }
  async check(userId: string) {
    const items = await this.cartMapper.list(userId); const invalidIds: string[] = [];
    for (const item of items) { const stock = item.skuId !== '0' ? (await this.skuModel.findOneBy({ id: item.skuId }))?.stock : (await this.productModel.findOneBy({ id: item.productId }))?.stock; if (stock === undefined || stock < item.qty) invalidIds.push(item.id); else if (item.stock !== stock) { item.stock = stock; await this.cartMapper.save(item); } }
    return { invalidIds };
  }
  private toVo(item: CartItemEntity) { return { id: item.id, productId: item.productId, title: item.title, cover: item.cover, sku: item.skuName, price: Number(item.price), qty: item.qty, stock: item.stock, shop: item.shopName, checked: Boolean(item.checked) }; }
}
