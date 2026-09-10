/**
 * 【m1-goods 模块】购物车（wudong_common_cart_item）
 * service 层：库存/归属校验与购物车业务逻辑
 */
import { Inject, Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { ApiError } from '../../m5-community/error/api_error';
import { CartMapper } from '../mapper/cart_mapper';
import { CartItemEntity } from '../entity/cart_item_entity';
import { ProductEntity } from '../entity/product_entity';
import { SkuEntity } from '../entity/sku_entity';

export interface AddCartPayload {
  productId: string;
  /** SKU 主键；无 SKU 商品可不传 */
  skuId?: string;
  qty?: number;
  /** 店铺名快照，不传由后端按商品 module 推导 */
  shop?: string;
}

export interface CartItemVo {
  id: string;
  productId: string;
  /** SKU 主键，无 SKU 商品为 '0'；结算写订单明细需要 */
  skuId: string;
  title: string;
  cover: string;
  /** SKU 名快照（实体 sku_name） */
  sku: string;
  price: number;
  qty: number;
  stock: number;
  shop: string;
  checked: boolean;
}

@Provide()
export class CartService {
  @Inject()
  cartMapper: CartMapper;

  @InjectEntityModel(ProductEntity)
  productModel: Repository<ProductEntity>;

  @InjectEntityModel(SkuEntity)
  skuModel: Repository<SkuEntity>;

  /** 购物车列表 */
  async list(userId: string): Promise<CartItemVo[]> {
    return (await this.cartMapper.list(userId)).map((item) => this.toVo(item));
  }

  /**
   * 加入购物车：同商品同 SKU 累加数量，并校验商品/规格与库存
   */
  async add(userId: string, payload: AddCartPayload): Promise<CartItemVo[]> {
    const productId = String(payload?.productId || '');
    if (!/^\d+$/.test(productId)) {
      throw new ApiError(1004, '参数错误：商品 ID 不合法');
    }
    const product = await this.productModel.findOne({
      where: { id: productId, status: 'ON_SHELF' },
    });
    if (!product) {
      throw new ApiError(1003, '商品不存在或已下架', 404);
    }

    const skuId = String(payload?.skuId || '0');
    if (skuId !== '0' && !/^\d+$/.test(skuId)) {
      throw new ApiError(1004, '参数错误：规格 ID 不合法');
    }
    const sku =
      skuId !== '0'
        ? await this.skuModel.findOne({ where: { id: skuId, productId: product.id } })
        : null;
    if (skuId !== '0' && !sku) {
      throw new ApiError(1003, '商品规格不存在', 404);
    }

    const stock = sku?.stock ?? product.stock;
    const qty = Number(payload?.qty ?? 1);
    if (!Number.isInteger(qty) || qty < 1) {
      throw new ApiError(1004, '数量必须是正整数');
    }

    const existing = await this.cartMapper.findBySku(userId, skuId);
    const nextQty = (existing?.qty ?? 0) + qty;
    if (nextQty > stock) {
      throw new ApiError(3002, `库存不足，最多可购买 ${stock} 件`);
    }

    const item = existing || new CartItemEntity();
    Object.assign(item, {
      userId,
      productId: product.id,
      skuId,
      merchantId: product.merchantId,
      qty: nextQty,
      checked: existing ? existing.checked : true,
      title: product.title,
      cover: product.cover,
      skuName: sku?.name || '默认规格',
      price: sku?.price ?? product.price,
      stock,
      shopName:
        payload?.shop?.trim() ||
        (product.module === 'SPECIALTY' ? '乌东特产合作社' : '乌东非遗工坊'),
    });
    await this.cartMapper.save(item);
    return this.list(userId);
  }

  /** 更新数量或勾选状态，返回最新购物车 */
  async update(
    userId: string,
    id: string,
    patch: { qty?: number; checked?: boolean }
  ): Promise<CartItemVo[]> {
    if (!/^\d+$/.test(String(id))) {
      throw new ApiError(1003, '购物车商品不存在', 404);
    }
    const item = await this.cartMapper.findById(userId, String(id));
    if (!item) {
      throw new ApiError(1003, '购物车商品不存在', 404);
    }

    if (patch?.qty !== undefined) {
      const qty = Number(patch.qty);
      if (!Number.isInteger(qty) || qty < 1 || qty > item.stock) {
        throw new ApiError(3002, `库存不足，最多可购买 ${item.stock} 件`);
      }
      item.qty = qty;
    }
    if (patch?.checked !== undefined) {
      item.checked = Boolean(patch.checked);
    }
    await this.cartMapper.save(item);
    return this.list(userId);
  }

  /** 删除（软删除）单条购物车项 */
  async remove(userId: string, id: string): Promise<CartItemVo[]> {
    if (/^\d+$/.test(String(id))) {
      const item = await this.cartMapper.findById(userId, String(id));
      if (item) await this.cartMapper.remove(item);
    }
    return this.list(userId);
  }

  /**
   * 结算前校验：下架/失效商品或库存不足的购物车项返回 id；
   * 其余项把最新库存快照同步回购物车
   */
  async check(userId: string): Promise<{ invalidIds: string[] }> {
    const items = await this.cartMapper.list(userId);
    const invalidIds: string[] = [];
    for (const item of items) {
      const stock =
        item.skuId !== '0'
          ? (await this.skuModel.findOneBy({ id: item.skuId }))?.stock
          : (await this.productModel.findOneBy({ id: item.productId }))?.stock;
      if (stock === undefined || stock < item.qty) {
        invalidIds.push(item.id);
      } else if (item.stock !== stock) {
        item.stock = stock;
        await this.cartMapper.save(item);
      }
    }
    return { invalidIds };
  }

  /** 实体 → 前端契约 CartItem */
  private toVo(item: CartItemEntity): CartItemVo {
    return {
      id: item.id,
      productId: item.productId,
      skuId: item.skuId,
      title: item.title,
      cover: item.cover,
      sku: item.skuName,
      price: Number(item.price),
      qty: Number(item.qty),
      stock: Number(item.stock),
      shop: item.shopName,
      checked: Boolean(item.checked),
    };
  }
}
