/**
 * 【order 模块】数据访问层：封装 Repository 与事务，Service 只依赖本文件
 *
 * 事务边界集中在本层：订单状态变更与 payment / order_event 必须同事务落库
 * （规范 8.3「事务内落库 + 异步投递」），避免出现「订单已支付但没有支付单」这类半成品数据。
 */
import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { DeepPartial, EntityManager, In, Repository } from 'typeorm';
import { ApiError } from '../../m5-community/error/api_error';
import { M1OrderExtEntity } from '../entity/m1_order_ext_entity';
import { M2OrderExtEntity } from '../entity/m2_order_ext_entity';
import { M3OrderExtEntity } from '../entity/m3_order_ext_entity';
import { M4OrderExtEntity } from '../entity/m4_order_ext_entity';
import { OrderEntity } from '../entity/order_entity';
import { OrderEventEntity } from '../entity/order_event_entity';
import { OrderItemEntity } from '../entity/order_item_entity';
import { PaymentEntity } from '../entity/payment_entity';

/** 扩展表归属模块，决定写入哪张 wudong_mX_order_ext */
export type OrderExtKind = 'm1' | 'm2' | 'm3' | 'm4';

/** 待写入的扩展行：kind 与 row 必须匹配同一声明分支 */
export type OrderExtInput =
  | { kind: 'm1'; row: DeepPartial<M1OrderExtEntity> }
  | { kind: 'm2'; row: DeepPartial<M2OrderExtEntity> }
  | { kind: 'm3'; row: DeepPartial<M3OrderExtEntity> }
  | { kind: 'm4'; row: DeepPartial<M4OrderExtEntity> };

/** 下单事务的完整载荷 */
export interface CreateBundleInput {
  order: DeepPartial<OrderEntity>;
  items: DeepPartial<OrderItemEntity>[];
  ext: OrderExtInput;
  event: DeepPartial<OrderEventEntity>;
}

/**
 * 订单局部更新载荷。取自 Repository.update 的第二参，
 * 而不是深引 typeorm/query-builder 的内部类型——后者不在根导出里，且随版本易变。
 */
type OrderPatch = Parameters<Repository<OrderEntity>['update']>[1];

/**
 * 状态流转事务的载荷。
 *
 * 状态更新不是「读到什么就写什么」，而是带前置状态条件的 UPDATE：
 * `WHERE id = ? AND status IN (fromStatuses)`。并发下只有一个请求能命中，
 * 其余 affected=0 即整笔回滚报 3001，避免同一订单被重复支付/重复退款。
 * payment 有值则一并落库（支付=无 id 新增，退款=带 id 更新原单）。
 */
export interface TransitionInput {
  orderId: string;
  /** 允许流转的前置状态 */
  fromStatuses: string[];
  patch: OrderPatch;
  event: DeepPartial<OrderEventEntity>;
  payment?: DeepPartial<PaymentEntity> | null;
}

@Provide()
export class OrderMapper {
  // 只注入需要直接查询的两张表；明细 / 扩展 / 事件的写入全部走事务内的
  // manager.create(...)，因此不再各自注入 Repository。
  @InjectEntityModel(OrderEntity)
  orders: Repository<OrderEntity>;

  @InjectEntityModel(PaymentEntity)
  payments: Repository<PaymentEntity>;

  /** 下单：订单 + 明细 + 扩展 + 事件同一事务落库 */
  async createBundle(input: CreateBundleInput): Promise<OrderEntity> {
    return this.orders.manager.transaction(async (manager) => {
      const order = await manager.save(manager.create(OrderEntity, input.order));

      if (input.items.length) {
        await manager.save(
          input.items.map((row) =>
            manager.create(OrderItemEntity, { ...row, orderId: order.id }),
          ),
        );
      }

      await this.saveExt(manager, input.ext, order.id);
      await manager.save(manager.create(OrderEventEntity, input.event));
      return order;
    });
  }

  /**
   * 状态流转：条件更新订单 + 事件（+ 可选 payment）同一事务落库。
   * 条件命中 0 行说明状态已被并发改动，抛 3001 并回滚整笔（payment / 事件都不会落）。
   */
  async applyTransition(input: TransitionInput): Promise<void> {
    await this.orders.manager.transaction(async (manager) => {
      const updated = await manager.update(
        OrderEntity,
        { id: input.orderId, status: In(input.fromStatuses) },
        input.patch,
      );
      if (!updated.affected) {
        throw new ApiError(3001, '订单状态不允许该操作');
      }
      if (input.payment) {
        await manager.save(manager.create(PaymentEntity, input.payment));
      }
      await manager.save(manager.create(OrderEventEntity, input.event));
    });
  }

  /** 按单号取订单，强制带 user_id 校验归属（防越权） */
  async findOwned(userId: string, orderNo: string): Promise<OrderEntity | null> {
    return this.orders.findOne({ where: { userId, orderNo } });
  }

  /** 订单列表，按 type / status 过滤，新的在前 */
  async list(userId: string, type?: string, status?: string): Promise<OrderEntity[]> {
    return this.orders.find({
      where: {
        userId,
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
      },
      order: { id: 'DESC' },
    });
  }

  /** 取该订单的支付单（退款时置为 REFUNDED） */
  async findPayment(orderNo: string, userId: string): Promise<PaymentEntity | null> {
    return this.payments.findOne({ where: { orderNo, userId }, order: { id: 'DESC' } });
  }

  /**
   * 四张扩展表列各不相同、无共同基类，只能按 kind 显式分派。
   * 这是本层唯一的分支点，收敛在这里好过散到 Service。
   */
  private async saveExt(
    manager: EntityManager,
    ext: OrderExtInput,
    orderId: string,
  ): Promise<void> {
    switch (ext.kind) {
      case 'm1':
        await manager.save(manager.create(M1OrderExtEntity, { ...ext.row, orderId }));
        return;
      case 'm2':
        await manager.save(manager.create(M2OrderExtEntity, { ...ext.row, orderId }));
        return;
      case 'm3':
        await manager.save(manager.create(M3OrderExtEntity, { ...ext.row, orderId }));
        return;
      case 'm4':
        await manager.save(manager.create(M4OrderExtEntity, { ...ext.row, orderId }));
        return;
    }
  }
}
