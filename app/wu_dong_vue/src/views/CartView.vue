<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { unwrapError } from '@/api'
import { addressApi } from '@/api/address'
import type { Address } from '@/types'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'
import { useMockPay } from '@/composables/useMockPay'
import QtyStepper from '@/components/QtyStepper.vue'
import EmptyState from '@/components/EmptyState.vue'
import AppIcon from '@/components/AppIcon.vue'
import PayDialog from '@/components/PayDialog.vue'

const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()
const addresses = ref<Address[]>([])
const selectedAddressId = ref('')
const selectedAddress = computed(() => addresses.value.find((a) => a.id === selectedAddressId.value))
// 购物车是支付入口：结算即下单，并立刻弹出虚拟支付
const { pendingOrder, askPay, onPaid, onDismiss } = useMockPay()

// 购物车是私有数据，接口要求 Bearer token：未登录先引导登录
onMounted(async () => {
  if (!userStore.requireLogin()) {
    router.replace({ path: '/login', query: { redirect: '/cart' } })
    return
  }
  await Promise.all([loadCart(), loadAddresses()])
})

async function loadAddresses() {
  try {
    const res = await addressApi.list()
    addresses.value = Array.isArray(res.data) ? res.data : []
    if (!addresses.value.some((a) => a.id === selectedAddressId.value)) {
      selectedAddressId.value =
        addresses.value.find((a) => a.isDefault)?.id || addresses.value[0]?.id || ''
    }
  } catch (e) {
    userStore.toast(unwrapError(e).message)
  }
}

async function loadCart() {
  try {
    await cartStore.load()
  } catch (e) {
    userStore.toast(unwrapError(e).message)
  }
}

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
  try {
    for (const item of items) {
      if (item.checked !== checked) await cartStore.toggleChecked(item.id, checked)
    }
  } catch (e) {
    userStore.toast(unwrapError(e).message)
  }
}

async function removeChecked() {
  try {
    for (const item of cartStore.items.filter((i) => i.checked)) {
      await cartStore.remove(item.id)
    }
  } catch (e) {
    userStore.toast(unwrapError(e).message)
  }
}

async function toggleItem(id: string, checked: boolean) {
  try {
    await cartStore.toggleChecked(id, checked)
  } catch (e) {
    userStore.toast(unwrapError(e).message)
  }
}

async function changeQty(id: string, qty: number) {
  try {
    await cartStore.updateQty(id, qty)
  } catch (e) {
    userStore.toast(unwrapError(e).message)
  }
}

async function removeItem(id: string) {
  try {
    await cartStore.remove(id)
  } catch (e) {
    userStore.toast(unwrapError(e).message)
  }
}

async function checkout() {
  if (!cartStore.checkedItems.length) {
    userStore.toast('请先勾选商品')
    return
  }
  if (!selectedAddressId.value) {
    userStore.toast('请先添加并选择收货地址')
    return
  }
  try {
    const order = await cartStore.checkout(selectedAddressId.value)
    askPay(order)
  } catch (e) {
    userStore.toast(unwrapError(e).message)
    await loadCart()
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
          <input type="checkbox" :checked="item.checked" @change="toggleItem(item.id, !item.checked)" />
          <img :src="item.cover" :alt="item.title" />
          <div class="ci-info">
            <b>{{ item.title }}</b>
            <span class="sku">{{ item.sku }}</span>
            <span v-if="item.qty >= item.stock" class="stock-warn">库存紧张：仅剩 {{ item.stock }} 件</span>
          </div>
          <span class="price ci-price">{{ item.price }}</span>
          <QtyStepper :model-value="item.qty" :max="item.stock" @update:model-value="(v) => changeQty(item.id, v)" />
          <span class="ci-sum">¥{{ (item.price * item.qty).toFixed(0) }}</span>
          <button class="ci-del" aria-label="删除" @click="removeItem(item.id)">
            <AppIcon name="trash" :size="16" />
          </button>
        </div>
      </div>

      <div class="shipping-box">
        <div class="shipping-main">
          <label for="cart-address">收货地址</label>
          <select
            id="cart-address"
            v-model="selectedAddressId"
            :disabled="!addresses.length"
          >
            <option v-if="!addresses.length" value="">暂无收货地址</option>
            <option v-for="address in addresses" :key="address.id" :value="address.id">
              {{ address.name }} {{ address.phone }} · {{ address.region }} {{ address.detail }}
            </option>
          </select>
          <p v-if="selectedAddress">
            {{ selectedAddress.region }} {{ selectedAddress.detail }}
          </p>
        </div>
        <router-link to="/user">管理地址</router-link>
      </div>

      <div class="settle-bar">
        <button class="del-checked" @click="removeChecked">
          <AppIcon name="trash" :size="14" /> 删除选中
        </button>
        <div class="total">
          已选 <b>{{ cartStore.checkedItems.length }}</b> 件 · 合计
          <span class="price">{{ cartStore.checkedTotal }}</span>
        </div>
        <button class="btn btn-primary btn-lg" :disabled="!selectedAddressId" @click="checkout">
          结算并支付
        </button>
      </div>
    </template>

    <!-- 下单后立即弹虚拟支付 -->
    <PayDialog :order="pendingOrder" @paid="onPaid" @dismiss="onDismiss" />
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

.shipping-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 16px 20px;
  margin-top: 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: #fff;
}

.shipping-main {
  flex: 1;
  min-width: 0;
}

.shipping-main label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-2);
  font-size: 12px;
}

.shipping-main select {
  width: 100%;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  background: #fff;
  color: var(--text);
  font-size: 13px;
}

.shipping-main p {
  margin-top: 7px;
  color: var(--text-3);
  font-size: 12px;
}

.shipping-box > a {
  flex: none;
  color: var(--primary);
  font-size: 13px;
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
