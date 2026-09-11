/**
 * 【m1-goods 模块】实物下单（购物车结算 / 立即购买）
 *
 * 职责边界：
 * - 商品/SKU 库存、订单明细、购物车项都属于 m1 的业务数据，扣减与清理在本模块事务内完成；
 * - 订单主表由公共 order 模块负责，本服务在同一事务内调用 OrderService.createOrder(input, em)；
 * - 金额、标题、摘要、店铺名一律服务端重算，不信任前端传入值。
 *
 * 两条入口共用同一套算价与扣库存逻辑：
 * - createFromCart：购物车勾选结算，下单后清空对应购物车项；
 * - createDirect：商品详情「立即购买」，不经过购物车。
 *
 * 并发安全：库存用条件 UPDATE（stock >= qty）扣减，任一商品失败整单回滚。
 */
import { Inject, Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource, EntityManager, In, IsNull } from 'typeorm';
import { ApiError } from '../../m5-community/error/api_error';
import { OrderEntity } from '../../order/entity/order_entity';
import { OrderItemEntity } from '../../order/entity/order_item_entity';
import { OrderService } from '../../order/service/order_service';
import { CartItemEntity } from '../entity/cart_item_entity';
import { ProductEntity } from '../entity/product_entity';
import { SkuEntity } from '../entity/sku_entity';

/** 单次下单最多商品项，避免超大请求 */
const MAX_LINES = 50;
const MAX_QTY = 99;
const PAY_EXPIRE_MS = 30 * 60 * 1000;

/** 立即购买入参（不走购物车） */
export interface DirectBuyItem {
  productId: string | number;
  /** 不传则取该商品的首个 SKU */
  skuId?: string | number;
  qty: number | string;
}

/** 结算行：算价与扣库存的唯一数据来源，购物车与立即购买共用 */
interface CheckoutLine {
  productId: string;
  skuId: string;
  skuName: string;
  title: string;
  cover: string;
  price: number;
  qty: number;
  module: 'GOODS' | 'SPECIALTY';
  merchantId: string;
  shopName: string;
}

@Provide()
export class CartCheckoutService {
  @Inject()
  orderService!: OrderService;

  @InjectDataSource('default')
  dataSource!: DataSource;

  /** 购物车结算：建一张订单（不按商家拆单）+ N 条订单明细，扣库存并清空已下单购物车项 */
  async createFromCart(
    userId: string,
    cartItemIds: unknown,
  ): Promise<OrderEntity> {
    const ids = this.normalizeCartIds(cartItemIds);

    return this.dataSource.transaction(async (em) => {
      const cartRepo = em.getRepository(CartItemEntity);
      const items = await cartRepo.find({
        where: { id: In(ids), userId, deletedAt: IsNull() },
      });
      // 少一条即说明存在越权 ID 或已被删除，整体拒绝
      if (items.length !== ids.length) {
        throw new ApiError(1003, '购物车商品不存在或不属于当前用户', 404);
      }

      const lines: CheckoutLine[] = [];
      for (const item of items) {
        lines.push(
          await this.resolveLine(em, item.productId, item.skuId, Number(item.qty)),
        );
      }

      await this.deductStock(em, lines);
      const order = await this.saveOrder(em, userId, lines);
      await cartRepo.softRemove(items);
      return order;
    });
  }

  /** 立即购买：按商品 + 规格 + 数量直接下单，不写购物车 */
  async createDirect(userId: string, items: unknown): Promise<OrderEntity> {
    const parsed = this.normalizeDirectItems(items);

    return this.dataSource.transaction(async (em) => {
      const lines: CheckoutLine[] = [];
      for (const item of parsed) {
        lines.push(
          await this.resolveLine(em, item.productId, item.skuId, Number(item.qty)),
        );
      }
      await this.deductStock(em, lines);
      return this.saveOrder(em, userId, lines);
    });
  }

  /**
   * 取消实物订单：按订单明细回补 SKU/商品库存并回退销量，与订单置 CANCELLED 同事务。
   */
  async release(order: OrderEntity): Promise<OrderEntity> {
    return this.dataSource.transaction(async (em) => {
      const lines = await em.getRepository(OrderItemEntity).find({
        where: { orderId: order.id },
      });
      for (const line of lines) {
        const qty = Number(line.qty);
        if (qty <= 0) continue;
        if (String(line.skuId) !== '0') {
          await em.query(
            'UPDATE wudong_m1_sku SET stock = stock + ? WHERE id = ?',
            [qty, line.skuId],
          );
        }
        await em.query(
          'UPDATE wudong_m1_product SET stock = stock + ?, sales = GREATEST(sales - ?, 0) WHERE id = ?',
          [qty, qty, line.targetId],
        );
      }
      return this.orderService.cancelOrder(order.orderNo, order.userId, em);
    });
  }

  /**
   * 商品 + 规格 → 结算行：校验在售与数量，价格取实时值（SKU 优先）。
   */
  private async resolveLine(
    em: EntityManager,
    productId: string | number,
    skuId: string | number | undefined,
    qty: number,
  ): Promise<CheckoutLine> {
    const pid = String(productId ?? '');
    if (!/^\d+$/.test(pid) || Number(pid) <= 0) {
      throw new ApiError(1004, '参数错误：商品 ID 不合法');
    }
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
      throw new ApiError(1004, `购买数量需为 1-${MAX_QTY} 件`);
    }

    const product = await em
      .getRepository(ProductEntity)
      .findOne({ where: { id: pid } });
    if (!product || product.status !== 'ON_SHELF') {
      throw new ApiError(1003, '商品不存在或已下架', 404);
    }

    let sku: SkuEntity | null = null;
    const rawSku = String(skuId ?? '0');
    if (rawSku !== '0') {
      if (!/^\d+$/.test(rawSku)) {
        throw new ApiError(1004, '参数错误：规格 ID 不合法');
      }
      sku = await em
        .getRepository(SkuEntity)
        .findOne({ where: { id: rawSku, productId: product.id } });
      if (!sku) {
        throw new ApiError(1003, `「${product.title}」规格已变更，请重新选择`, 404);
      }
    } else {
      // 未指定规格时回退到首个 SKU：uk_user_sku(user_id, sku_id) 不含 product_id，
      // 全部落 sku_id=0 会导致购物车/结算互相覆盖。
      sku = await em.getRepository(SkuEntity).findOne({
        where: { productId: product.id },
        order: { id: 'ASC' },
      });
    }

    return {
      productId: String(product.id),
      skuId: sku ? String(sku.id) : '0',
      skuName: sku?.name || '默认规格',
      title: product.title,
      cover: product.cover,
      price: Number(sku?.price ?? product.price),
      qty,
      module: product.module,
      merchantId: String(product.merchantId),
      shopName:
        product.module === 'SPECIALTY' ? '乌东特产合作社' : '乌东非遗工坊',
    };
  }

  /** 条件扣减库存：SKU 与商品冗余总库存同步扣减，任一失败整单回滚 */
  private async deductStock(em: EntityManager, lines: CheckoutLine[]) {
    for (const line of lines) {
      if (line.skuId !== '0') {
        const skuRes: any = await em.query(
          'UPDATE wudong_m1_sku SET stock = stock - ? WHERE id = ? AND stock >= ?',
          [line.qty, line.skuId, line.qty],
        );
        if (!skuRes || skuRes.affectedRows !== 1) {
          throw new ApiError(3002, `「${line.title}」库存不足，请调整数量`);
        }
      }
      const productRes: any = await em.query(
        'UPDATE wudong_m1_product SET stock = stock - ?, sales = sales + ? WHERE id = ? AND stock >= ?',
        [line.qty, line.qty, line.productId, line.qty],
      );
      if (!productRes || productRes.affectedRows !== 1) {
        throw new ApiError(3002, `「${line.title}」库存不足，请调整数量`);
      }
    }
  }

  /** 建订单主表 + 明细：标题/摘要/店铺/金额全部服务端组装 */
  private async saveOrder(
    em: EntityManager,
    userId: string,
    lines: CheckoutLine[],
  ): Promise<OrderEntity> {
    const amount = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
    const qty = lines.reduce((sum, line) => sum + line.qty, 0);
    const shops = [...new Set(lines.map((line) => line.shopName).filter(Boolean))];
    const merchants = [...new Set(lines.map((line) => line.merchantId))];
    const title =
      shops.length > 1
        ? `${shops[0]} 等 ${shops.length} 家店铺`
        : shops[0] || '乌东集市';
    // 明细全为特产时记 SPECIALTY，其余记 GOODS
    const type = lines.every((line) => line.module === 'SPECIALTY')
      ? 'SPECIALTY'
      : 'GOODS';

    const order = await this.orderService.createOrder(
      {
        userId,
        type,
        status: 'UNPAID',
        title,
        cover: lines[0].cover,
        summary: lines
          .map((line) => `${line.title} × ${line.qty}`)
          .join('；')
          .slice(0, 500),
        amount,
        qty,
        shopName: shops[0] || '乌东集市',
        merchantId: merchants.length === 1 ? merchants[0] : '0',
        expireAt: new Date(Date.now() + PAY_EXPIRE_MS),
      },
      em,
    );

    const itemRepo = em.getRepository(OrderItemEntity);
    await itemRepo.save(
      lines.map((line) =>
        itemRepo.create({
          orderId: order.id,
          targetType: line.module,
          targetId: line.productId,
          skuId: line.skuId,
          title: line.title,
          cover: line.cover,
          skuName: line.skuName,
          price: line.price,
          qty: line.qty,
          amount: line.price * line.qty,
        }),
      ),
    );

    return order;
  }

  private normalizeCartIds(input: unknown): string[] {
    if (!Array.isArray(input) || input.length === 0) {
      throw new ApiError(1004, '请先勾选要结算的商品');
    }
    if (input.length > MAX_LINES) {
      throw new ApiError(1004, `单次结算最多 ${MAX_LINES} 件商品`);
    }
    const ids = [...new Set(input.map((id) => String(id)))];
    if (ids.some((id) => !/^\d+$/.test(id) || Number(id) <= 0)) {
      throw new ApiError(1004, '参数错误：购物车项 ID 不合法');
    }
    return ids;
  }

  private normalizeDirectItems(input: unknown): DirectBuyItem[] {
    if (!Array.isArray(input) || input.length === 0) {
      throw new ApiError(1004, '请选择要购买的商品');
    }
    if (input.length > MAX_LINES) {
      throw new ApiError(1004, `单次最多购买 ${MAX_LINES} 种商品`);
    }
    return input.map((raw: any) => ({
      productId: String(raw?.productId ?? ''),
      skuId:
        raw?.skuId === undefined || raw?.skuId === null
          ? undefined
          : String(raw.skuId),
      qty: Number(raw?.qty ?? 1),
    }));
  }
}
