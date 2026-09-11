<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as api from '@/api'
import { unwrapError } from '@/api'
import type { Order } from '@/types'
import { useUserStore } from '@/stores/user'
import EmptyState from '@/components/EmptyState.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const orderNo = route.params.orderNo as string
const order = ref<Order | null>(null)
const loading = ref(true)
const paying = ref(false)
const notFound = ref(false)
const errMsg = ref('')

onMounted(async () => {
  try {
    const res = await api.getOrderDetail(orderNo)
    order.value = res.data
    // 已支付（刷新/重复进入）直接落结果页
    if (res.data.status === 'PAID') {
      router.replace(`/order/result/${orderNo}`)
    } else if (res.data.status !== 'UNPAID') {
      errMsg.value = '订单当前状态不可支付'
    }
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
})

async function confirmPay() {
  if (!order.value) return
  paying.value = true
  errMsg.value = ''
  try {
    await api.payOrder(orderNo)
    router.replace(`/order/result/${orderNo}`)
  } catch (e) {
    errMsg.value = unwrapError(e).message
  } finally {
    paying.value = false
  }
}

async function cancel() {
  if (!order.value) return
  try {
    await api.cancelOrder(orderNo, order.value.type)
    userStore.toast('订单已取消，房态已释放')
    router.replace('/orders')
  } catch (e) {
    userStore.toast(unwrapError(e).message)
  }
}
</script>

<template>
  <div class="pay-page container">
    <EmptyState v-if="notFound" text="订单不存在或已关闭">
      <router-link to="/orders" class="btn btn-outline">返回我的订单</router-link>
    </EmptyState>

    <template v-else-if="order">
      <h1 class="h-display title">收银台</h1>
      <p class="mock-tip">模拟支付 · 不接入真实支付通道，不会产生真实扣款</p>

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
          <span>支付金额</span>
          <em class="amount">¥{{ order.amount.toFixed(2) }}</em>
        </div>
        <p v-if="errMsg" class="err">{{ errMsg }}</p>

        <button
          class="btn btn-primary btn-lg pay-btn"
          :disabled="paying || !!errMsg"
          @click="confirmPay"
        >
          {{ paying ? '支付中…' : `确认支付 ¥${order.amount.toFixed(2)}` }}
        </button>
        <button class="btn btn-ghost cancel-btn" :disabled="paying" @click="cancel">
          取消订单
        </button>
      </div>
    </template>

    <p v-else-if="loading" class="loading">加载中…</p>
  </div>
</template>

<style scoped>
.pay-page {
  max-width: 560px;
  padding-top: 36px;
  min-height: 50vh;
}
.title {
  font-size: 24px;
  margin-bottom: 6px;
}
.mock-tip {
  font-size: 12.5px;
  color: var(--text-3);
  margin-bottom: 20px;
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
  font-size: 22px;
  color: var(--accent, var(--primary));
  font-weight: 700;
}
.err {
  color: #c0392b;
  font-size: 12.5px;
  margin: 10px 0 0;
}
.pay-btn {
  width: 100%;
  margin-top: 18px;
}
.cancel-btn {
  width: 100%;
  margin-top: 10px;
}
.loading {
  text-align: center;
  color: var(--text-3);
  padding: 40px 0;
}
</style>