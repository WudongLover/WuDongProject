<script setup lang="ts">
/**
 * 模拟支付弹窗（虚拟支付）
 * 下单成功后立即弹出：购物车结算、商品立即购买、门票/路线/民宿预订共用。
 * 不做真实扣款，仅调用后端 mock 支付接口把订单置为 PAID。
 */
import { computed, ref } from 'vue'
import * as api from '@/api'
import { unwrapError } from '@/api'
import type { Order } from '@/types'
import AppIcon from '@/components/AppIcon.vue'

const props = defineProps<{ order: Order | null }>()
const emit = defineEmits<{
  (e: 'paid', order: Order): void
  (e: 'dismiss', order: Order): void
}>()

const paying = ref(false)
const errMsg = ref('')

/** 购物车合并下单的商品明细；无明细（门票/住宿等）时回退为标题 + 摘要 */
const lines = computed(() => props.order?.items?.length ? props.order.items : [])

async function confirm() {
  if (!props.order || paying.value) return
  paying.value = true
  errMsg.value = ''
  try {
    const res = await api.payOrder(props.order.orderNo)
    emit('paid', res.data)
  } catch (e) {
    errMsg.value = unwrapError(e).message
  } finally {
    paying.value = false
  }
}

function dismiss() {
  if (paying.value || !props.order) return
  emit('dismiss', props.order)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="order" class="pay-mask" @click.self="dismiss">
      <div class="pay-dialog" role="dialog" aria-modal="true" aria-label="模拟支付">
        <div class="pd-head">
          <span class="pd-badge"><AppIcon name="ticket" :size="18" /></span>
          <div>
            <h3>模拟支付</h3>
            <p>演示环境 · 不接入真实支付通道，不会产生真实扣款</p>
          </div>
        </div>

        <div class="pd-body">
          <div class="pd-merchant">
            <img :src="order.cover" :alt="order.title" />
            <div>
              <b>{{ order.shop }}</b>
              <span>{{ order.title }}</span>
            </div>
          </div>

          <div v-if="lines.length" class="pd-lines">
            <div v-for="it in lines" :key="it.id" class="pd-line">
              <span class="pd-line-title">{{ it.title }}</span>
              <span class="pd-line-sku">{{ it.sku }}</span>
              <span class="pd-line-amount">¥{{ it.amount.toFixed(2) }}<small>× {{ it.qty }}</small></span>
            </div>
          </div>
          <p v-else class="pd-summary">{{ order.summary }}</p>

          <div class="pd-row">
            <span>订单号</span>
            <em>{{ order.orderNo }}</em>
          </div>
          <div class="pd-row pd-total">
            <span>支付金额</span>
            <em class="amount">¥{{ order.amount.toFixed(2) }}</em>
          </div>

          <p v-if="errMsg" class="pd-err">{{ errMsg }}</p>
        </div>

        <div class="pd-foot">
          <button class="btn btn-primary btn-lg pd-pay" :disabled="paying" @click="confirm">
            {{ paying ? '支付中…' : `确认支付 ¥${order.amount.toFixed(2)}` }}
          </button>
          <button class="btn btn-ghost pd-later" :disabled="paying" @click="dismiss">暂不支付</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.pay-mask {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(15, 35, 56, 0.45);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.pay-dialog {
  width: 100%;
  max-width: 460px;
  max-height: 84vh;
  overflow: auto;
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-3);
}

.pd-head {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--line);
}

.pd-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--indigo-mist);
  color: var(--indigo);
}

.pd-head h3 {
  font-size: 17px;
  margin-bottom: 3px;
}

.pd-head p {
  font-size: 12px;
  color: var(--text-3);
}

.pd-body {
  padding: 16px 20px 6px;
}

.pd-merchant {
  display: flex;
  gap: 12px;
  align-items: center;
  padding-bottom: 14px;
  border-bottom: 1px dashed var(--line);
}

.pd-merchant img {
  width: 72px;
  height: 56px;
  object-fit: cover;
  border-radius: var(--radius);
}

.pd-merchant b {
  display: block;
  font-size: 14.5px;
  margin-bottom: 4px;
}

.pd-merchant span {
  font-size: 12.5px;
  color: var(--text-2);
}

.pd-lines {
  padding: 12px 0;
  border-bottom: 1px dashed var(--line);
}

.pd-line {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 4px 12px;
  padding: 5px 0;
  font-size: 13px;
}

.pd-line-title {
  font-weight: 600;
}

.pd-line-sku {
  grid-column: 1;
  font-size: 11.5px;
  color: var(--text-3);
}

.pd-line-amount {
  grid-row: span 2;
  align-self: center;
  text-align: right;
  font-family: var(--font-display);
  font-weight: 700;
}

.pd-line-amount small {
  display: block;
  font-weight: 400;
  font-size: 11px;
  color: var(--text-3);
}

.pd-summary {
  padding: 12px 0;
  font-size: 12.5px;
  color: var(--text-2);
  border-bottom: 1px dashed var(--line);
}

.pd-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 9px 0 0;
  font-size: 13px;
  color: var(--text-2);
}

.pd-row em {
  font-style: normal;
}

.pd-total .amount {
  font-size: 22px;
  font-weight: 700;
  color: var(--accent);
}

.pd-err {
  margin: 10px 0 0;
  font-size: 12.5px;
  color: #c0392b;
}

.pd-foot {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 20px 20px;
}

.pd-pay,
.pd-later {
  width: 100%;
}
</style>
