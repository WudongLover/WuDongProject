<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as api from '@/api'
import type { Order } from '@/types'
import EmptyState from '@/components/EmptyState.vue'
import AppIcon from '@/components/AppIcon.vue'

const route = useRoute()
const router = useRouter()

const orderNo = route.params.orderNo as string
const order = ref<Order | null>(null)
const loading = ref(true)
const notFound = ref(false)

onMounted(async () => {
  try {
    const res = await api.getOrderDetail(orderNo)
    order.value = res.data
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
})

/** 按订单类型与状态给出结果文案 */
const head = computed(() => {
  const o = order.value
  if (!o) return { title: '', desc: '', tone: 'ok' }
  if (o.status === 'CANCELLED') {
    return { title: '订单已取消', desc: '房态已为您释放', tone: 'muted' }
  }
  if (o.status === 'UNPAID') {
    return { title: '订单待支付', desc: '请在 30 分钟内完成预付', tone: 'warn' }
  }
  if (o.type === 'MEAL') {
    return { title: '预订成功', desc: '餐位已为您保留，请按时到店用餐', tone: 'ok' }
  }
  if (o.type === 'LODGING') {
    return { title: '支付成功', desc: '民宿已预订成功，期待您的入住', tone: 'ok' }
  }
  return { title: '下单成功', desc: '', tone: 'ok' }
})
</script>

<template>
  <div class="result-page container">
    <EmptyState v-if="notFound" text="订单不存在">
      <router-link to="/orders" class="btn btn-outline">返回我的订单</router-link>
    </EmptyState>

    <p v-else-if="loading" class="loading">加载中…</p>

    <template v-else-if="order">
      <div class="hero" :class="head.tone">
        <span class="badge"><AppIcon name="check" :size="30" /></span>
        <h1 class="h-display">{{ head.title }}</h1>
        <p>{{ head.desc }}</p>
      </div>

      <div class="card">
        <div class="merchant">
          <img :src="order.cover" :alt="order.title" />
          <div>
            <b>{{ order.shop }}</b>
            <span>{{ order.title }}</span>
            <small>{{ order.summary }}</small>
          </div>
        </div>
        <div class="row">
          <span>订单号</span>
          <em>{{ order.orderNo }}</em>
        </div>
        <div class="row">
          <span>下单日期</span>
          <em>{{ order.date }}</em>
        </div>
        <div class="row">
          <span>{{ order.type === 'MEAL' ? '预估消费（到店支付）' : '支付金额' }}</span>
          <em class="amount">¥{{ order.amount.toFixed(2) }}</em>
        </div>
      </div>

      <div class="actions">
        <router-link to="/orders" class="btn btn-primary">查看我的订单</router-link>
        <router-link to="/" class="btn btn-outline">回到首页</router-link>
        <router-link
          v-if="order.status === 'UNPAID'"
          :to="`/order/pay/${order.orderNo}`"
          class="btn btn-primary"
        >
          去支付
        </router-link>
      </div>
    </template>
  </div>
</template>

<style scoped>
.result-page {
  max-width: 560px;
  padding-top: 40px;
  min-height: 50vh;
}
.hero {
  text-align: center;
  margin-bottom: 22px;
}
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #3d6b4f;
  color: #fff;
  margin-bottom: 14px;
}
.hero.muted .badge {
  background: var(--text-3);
}
.hero.warn .badge {
  background: var(--amber, #c98a1b);
}
.hero h1 {
  font-size: 24px;
  margin-bottom: 8px;
}
.hero p {
  color: var(--text-2);
  font-size: 13.5px;
}
.card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 20px;
}
.merchant {
  display: flex;
  gap: 14px;
  padding-bottom: 16px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--line);
}
.merchant img {
  width: 86px;
  height: 64px;
  object-fit: cover;
  border-radius: var(--radius);
}
.merchant b {
  display: block;
  font-size: 15px;
  margin-bottom: 4px;
}
.merchant span {
  display: block;
  font-size: 13px;
  margin-bottom: 3px;
}
.merchant small {
  color: var(--text-3);
  font-size: 12px;
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13.5px;
  padding: 8px 0;
}
.row em {
  font-style: normal;
  color: var(--text-2);
}
.amount {
  font-size: 20px;
  color: var(--primary);
  font-weight: 700;
}
.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
  flex-wrap: wrap;
}
.loading {
  text-align: center;
  color: var(--text-3);
  padding: 40px 0;
}
</style>