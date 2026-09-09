<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'
import { unwrapError } from '@/api'
import QtyStepper from '@/components/QtyStepper.vue'
import EmptyState from '@/components/EmptyState.vue'
import AppIcon from '@/components/AppIcon.vue'

const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

onMounted(() => cartStore.load())

function shopGroups() {
  const map = new Map<string, typeof cartStore.items>()
  for (const item of cartStore.items) {
    if (!map.has(item.shop)) map.set(item.shop, [])
    map.get(item.shop)!.push(item)
  }
  return [...map.entries()].map(([shop, items]) => ({ shop, items }))
}

async function toggleShop(items: { checked: boolean; id: string }[], checked: boolean) {
  // 逐项串行提交，避免并发响应覆盖彼此勾选状态
  for (const item of items) {
    if (item.checked !== checked) await cartStore.toggleChecked(item.id, checked)
  }
}

async function checkout() {
  if (!cartStore.checkedItems.length) {
    userStore.toast('请先勾选商品')
    return
  }
  try {
    const order = await cartStore.checkout()
    userStore.toast('下单成功，去支付')
    router.push({ path: '/orders', query: { highlight: order.orderNo, pay: '1' } })
  } catch (e) {
    userStore.toast(unwrapError(e).message)
  }
}
</script>

<template>
  <div class="cart-page container">
    <h1 class="h-display page-title">购物车</h1>

    <EmptyState v-if="!cartStore.items.length" text="购物车空空如也，去苗寨寻些好物吧">
      <div style="display: flex; gap: 12px">
        <router-link to="/goods" class="btn btn-primary">去衣馆</router-link>
        <router-link to="/food?tab=specialty" class="btn btn-outline">去特产铺</router-link>
      </div>
    </EmptyState>

    <template v-else>
      <div class="head-row">
        <span>共 {{ cartStore.count }} 件商品</span>
        <span class="note">衣物实物与农产品特产共用购物车 · 民宿/餐位/门票为预订类，不进购物车</span>
      </div>

      <div v-for="g in shopGroups()" :key="g.shop" class="shop-group">
        <label class="shop-head">
          <input
            type="checkbox"
            :checked="g.items.every((i) => i.checked)"
            @change="toggleShop(g.items, ($event.target as HTMLInputElement).checked)"
          />
          <b>{{ g.shop }}</b>
        </label>

        <div v-for="item in g.items" :key="item.id" class="cart-item" :class="{ off: !item.checked }">
          <input type="checkbox" :checked="item.checked" @change="cartStore.toggleChecked(item.id, !item.checked)" />
          <img :src="item.cover" :alt="item.title" />
          <div class="ci-info">
            <b>{{ item.title }}</b>
            <span class="sku">{{ item.sku }}</span>
            <span v-if="item.qty >= item.stock" class="stock-warn">库存紧张：仅剩 {{ item.stock }} 件</span>
          </div>
          <span class="price ci-price">{{ item.price }}</span>
          <QtyStepper :model-value="item.qty" :max="item.stock" @update:model-value="(v) => cartStore.updateQty(item.id, v)" />
          <span class="ci-sum">¥{{ (item.price * item.qty).toFixed(0) }}</span>
          <button class="ci-del" aria-label="删除" @click="cartStore.remove(item.id)">
            <AppIcon name="trash" :size="16" />
          </button>
        </div>
      </div>

      <div class="settle-bar">
        <button class="del-checked" @click="cartStore.items.filter((i) => i.checked).forEach((i) => cartStore.remove(i.id))">
          <AppIcon name="trash" :size="14" /> 删除选中
        </button>
        <div class="total">
          已选 <b>{{ cartStore.checkedItems.length }}</b> 件 · 合计
          <span class="price">{{ cartStore.checkedTotal }}</span>
        </div>
        <button class="btn btn-primary btn-lg" @click="checkout">去结算（按商家拆单）</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.cart-page {
  padding-top: 36px;
  min-height: 50vh;
}

.page-title {
  font-size: 26px;
  margin-bottom: 22px;
}

.head-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--text-3);
  margin-bottom: 18px;
}

.note {
  letter-spacing: 0.03em;
}

.shop-group {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  margin-bottom: 18px;
  overflow: hidden;
}

.shop-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 20px;
  border-bottom: 1px solid var(--line);
  background: var(--paper);
  font-size: 14px;
}

.shop-head b {
  letter-spacing: 0.08em;
}

.cart-item {
  display: grid;
  grid-template-columns: auto 92px 1fr auto auto auto auto;
  gap: 16px;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px dashed var(--line);
  transition: opacity 0.2s;
}

.cart-item:last-child {
  border-bottom: none;
}

.cart-item.off {
  opacity: 0.55;
}

.cart-item img {
  width: 92px;
  height: 74px;
  object-fit: cover;
  border-radius: var(--radius);
}

.ci-info b {
  display: block;
  font-size: 14.5px;
  margin-bottom: 4px;
}

.ci-info .sku {
  font-size: 12px;
  color: var(--text-3);
  display: block;
}

.stock-warn {
  font-size: 11.5px;
  color: var(--accent);
}

.ci-price {
  font-size: 15px;
}

.ci-sum {
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--ink);
  min-width: 70px;
  text-align: right;
}

.ci-del {
  color: var(--text-3);
  padding: 6px;
  border-radius: var(--radius);
  transition: all 0.2s;
}

.ci-del:hover {
  color: var(--accent);
  background: rgba(181, 68, 46, 0.08);
}

input[type='checkbox'] {
  width: 16px;
  height: 16px;
  accent-color: var(--indigo);
  cursor: pointer;
}

.settle-bar {
  position: sticky;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 24px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(10px);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-2);
  padding: 14px 22px;
  margin-top: 22px;
}

.del-checked {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  color: var(--text-3);
}

.del-checked:hover {
  color: var(--accent);
}

.total {
  margin-left: auto;
  font-size: 14px;
  color: var(--text-2);
}

.total b {
  color: var(--accent);
}

.total .price {
  font-size: 24px;
  margin-left: 6px;
}

@media (max-width: 899px) {
  .cart-item {
    grid-template-columns: auto 72px 1fr;
    grid-template-rows: auto auto;
    row-gap: 8px;
  }

  .ci-price {
    display: none;
  }

  .ci-sum {
    grid-column: 3;
    text-align: left;
  }

  .settle-bar {
    flex-wrap: wrap;
    gap: 12px;
  }

  .total {
    margin-left: 0;
    flex: 1;
  }
}
</style>
