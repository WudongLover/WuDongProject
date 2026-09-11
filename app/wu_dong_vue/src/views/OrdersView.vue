<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import * as api from '@/api'
import { unwrapError } from '@/api'
import type { Order, OrderStatus, OrderType } from '@/types'
import { useUserStore } from '@/stores/user'
import EmptyState from '@/components/EmptyState.vue'
import AppIcon from '@/components/AppIcon.vue'

const route = useRoute()
const userStore = useUserStore()

const orders = ref<Order[]>([])
const loading = ref(true)
const typeTab = ref<OrderType | 'ALL'>('ALL')
const highlight = ref((route.query.highlight as string) || '')

const typeTabs: { key: OrderType | 'ALL'; label: string }[] = [
  { key: 'ALL', label: '全部' },
  { key: 'GOODS', label: '非遗商品' },
  { key: 'SPECIALTY', label: '特产' },
  { key: 'MEAL', label: '餐位' },
  { key: 'LODGING', label: '住宿' },
  { key: 'TICKET', label: '门票' },
  { key: 'ROUTE', label: '路线' },
]

const statusMap: Record<OrderStatus, { text: string; cls: string }> = {
  UNPAID: { text: '待支付', cls: 'st-unpaid' },
  PAID: { text: '已支付/待确认', cls: 'st-paid' },
  CONFIRMED: { text: '已确认', cls: 'st-confirm' },
  IN_PROGRESS: { text: '进行中', cls: 'st-progress' },
  COMPLETED: { text: '已完成', cls: 'st-done' },
  CANCELLED: { text: '已取消', cls: 'st-cancel' },
  REFUNDED: { text: '已退款', cls: 'st-refund' },
}

async function load() {
  loading.value = true
  try {
    const res = await api.getOrders({ type: typeTab.value })
    orders.value = res.data
  } catch (e) {
    userStore.toast(unwrapError(e).message)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await load()
})

async function cancel(o: Order) {
  try {
    // 住宿单走 m3 入口以在同事务回补房态，其余走通用订单入口
    await api.cancelOrder(o.orderNo, o.type)
    userStore.toast(o.type === 'LODGING' ? '订单已取消，房态已释放' : '订单已取消')
    await load()
  } catch (e) {
    userStore.toast(unwrapError(e).message)
  }
}

async function refund(o: Order) {
  try {
    await api.refundOrder(o.orderNo)
    userStore.toast('退款成功（原路退回）')
    await load()
  } catch (e) {
    userStore.toast(unwrapError(e).message)
  }
}

function review(o: Order) {
  userStore.toast('评价功能演示：感谢您的反馈 ★★★★★')
}

interface OrderLine {
  key: string
  title: string
  cover: string
  sub: string
  qtyText: string
  amount: number
}

/**
 * 订单展示行：
 * - 购物车合并支付只建一张订单，这里把订单明细逐项拆成独立行展示；
 * - 门票/住宿/餐位等无明细的订单，回退为单行（标题 + 摘要）。
 */
function orderLines(o: Order): OrderLine[] {
  if (o.items?.length) {
    return o.items.map((it, i) => ({
      key: `${o.orderNo}-${it.id ?? i}`,
      title: it.title,
      cover: it.cover,
      sub: [it.sku, `单价 ¥${it.price.toFixed(2)}`].filter(Boolean).join(' · '),
      qtyText: `× ${it.qty}`,
      amount: it.amount,
    }))
  }
  return [
    {
      key: o.orderNo,
      title: o.title,
      cover: o.cover,
      sub: o.summary,
      qtyText: `共 ${o.qty} 份`,
      amount: o.amount,
    },
  ]
}

/** 订单商品总件数（购物车单按明细累加） */
function orderQty(o: Order): number {
  return o.items?.length ? o.items.reduce((n, it) => n + it.qty, 0) : o.qty
}
</script>

<template>
  <div class="orders-page container">
    <h1 class="h-display page-title">我的订单</h1>

    <div class="tabs">
      <button
        v-for="t in typeTabs"
        :key="t.key"
        :class="{ on: typeTab === t.key }"
        @click="typeTab = t.key; load()"
      >
        {{ t.label }}
      </button>
    </div>

    <EmptyState v-if="!loading && !orders.length" text="暂无相关订单">
      <router-link to="/" class="btn btn-outline">去逛逛</router-link>
    </EmptyState>

    <div v-for="o in orders" :key="o.orderNo" class="order" :class="{ hl: o.orderNo === highlight }">
      <div class="o-head">
        <span class="o-no">订单号 {{ o.orderNo }}</span>
        <span class="o-shop">{{ o.shop }}</span>
        <time>{{ o.date }}</time>
        <span class="o-status" :class="statusMap[o.status].cls">{{ statusMap[o.status].text }}</span>
      </div>
      <div class="o-body">
        <div class="o-lines">
          <div v-for="line in orderLines(o)" :key="line.key" class="o-line">
            <img :src="line.cover" :alt="line.title" />
            <div class="o-info">
              <b>{{ line.title }}</b>
              <span>{{ line.sub }}</span>
            </div>
            <div class="o-amount">
              <span class="price">{{ line.amount }}</span>
              <small>{{ line.qtyText }}</small>
            </div>
          </div>
        </div>
        <div v-if="(o.items?.length || 0) > 1" class="o-total">
          <span>共 {{ orderQty(o) }} 件 · 合计</span>
          <b class="price">{{ o.amount }}</b>
        </div>
        <div class="o-actions">
          <!-- 支付入口在购物车/立即购买（下单即弹虚拟支付），这里只做查看与售后 -->
          <button v-if="['UNPAID', 'PAID'].includes(o.status)" class="btn btn-ghost" @click="cancel(o)">取消</button>
          <button v-if="['PAID', 'CONFIRMED'].includes(o.status)" class="btn btn-ghost" @click="refund(o)">申请退款</button>
          <button v-if="o.status === 'COMPLETED'" class="btn btn-outline" @click="review(o)">评价</button>
          <span v-if="o.status === 'IN_PROGRESS'" class="o-tip"><AppIcon name="check" :size="13" /> 商家已确认</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.orders-page {
  padding-top: 36px;
  min-height: 50vh;
}

.page-title {
  font-size: 26px;
  margin-bottom: 22px;
}

.tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 22px;
  border-bottom: 1px solid var(--line);
  padding-bottom: 14px;
}

.tabs button {
  padding: 7px 18px;
  border-radius: 999px;
  font-size: 13.5px;
  color: var(--text-2);
  border: 1px solid transparent;
  transition: all 0.2s;
}

.tabs button:hover {
  color: var(--primary);
}

.tabs button.on {
  background: var(--indigo);
  color: var(--silver-light);
  font-weight: 600;
}

.order {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  margin-bottom: 16px;
  overflow: hidden;
  transition: box-shadow 0.3s;
}

.order.hl {
  border-color: rgba(181, 68, 46, 0.55);
  box-shadow: 0 0 0 3px rgba(181, 68, 46, 0.12);
}

.o-head {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 11px 20px;
  background: var(--paper);
  font-size: 12.5px;
  color: var(--text-3);
  border-bottom: 1px solid var(--line);
  flex-wrap: wrap;
}

.o-no {
  font-weight: 600;
  color: var(--text-2);
  letter-spacing: 0.05em;
}

.o-status {
  margin-left: auto;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.st-unpaid { color: var(--accent); }
.st-paid { color: var(--amber); }
.st-confirm { color: var(--primary); }
.st-progress { color: var(--primary); }
.st-done { color: #3d6b4f; }
.st-cancel { color: var(--text-3); }
.st-refund { color: var(--text-3); }

.o-body {
  display: flex;
  gap: 22px;
  align-items: center;
  padding: 16px 20px;
}

.o-lines {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.o-line {
  display: grid;
  grid-template-columns: 110px 1fr auto;
  gap: 18px;
  align-items: center;
  padding: 10px 0;
  border-top: 1px dashed var(--line);
}

.o-line:first-child {
  padding-top: 0;
  border-top: none;
}

.o-line:last-child {
  padding-bottom: 0;
}

.o-line img {
  width: 110px;
  height: 82px;
  object-fit: cover;
  border-radius: var(--radius);
}

.o-total {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  font-size: 11.5px;
  color: var(--text-3);
  white-space: nowrap;
}

.o-total .price {
  font-size: 18px;
}

.o-info b {
  display: block;
  font-size: 15px;
  margin-bottom: 5px;
}

.o-info span {
  font-size: 12.5px;
  color: var(--text-2);
}

.o-amount {
  text-align: right;
}

.o-amount .price {
  font-size: 20px;
  display: block;
}

.o-amount small {
  font-size: 11.5px;
  color: var(--text-3);
}

.o-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 110px;
}

.o-actions .btn {
  padding: 7px 14px;
  font-size: 12.5px;
  letter-spacing: 0.05em;
}

.o-tip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--primary);
}

@media (max-width: 899px) {
  .o-body {
    flex-wrap: wrap;
    gap: 12px;
  }

  .o-lines {
    flex-basis: 100%;
  }

  .o-line {
    grid-template-columns: 72px 1fr;
    row-gap: 6px;
  }

  .o-line img {
    width: 72px;
    height: 58px;
    grid-row: span 2;
  }

  .o-line .o-amount {
    grid-column: 2;
    text-align: left;
  }

  .o-actions {
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>
