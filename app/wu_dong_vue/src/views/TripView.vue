<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as api from '@/api'
import { unwrapError } from '@/api'
import type { CultureSection, Scenic, TravelRoute } from '@/types'
import { useUserStore } from '@/stores/user'
import { useMockPay } from '@/composables/useMockPay'
import RouteCard from '@/components/RouteCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import AppIcon from '@/components/AppIcon.vue'
import CultureBand from '@/components/CultureBand.vue'
import PayDialog from '@/components/PayDialog.vue'
import { img } from '@/mock/images'

/** 文化导览推文：后端接口异步加载，先讲山水与节庆的来路，票种价格往后放 */
const culture = ref<CultureSection | null>(null)
onMounted(async () => {
  culture.value = (await api.getCultureSection('XING')) ?? null
})

const userStore = useUserStore()
// 门票下单后立即弹虚拟支付
const { pendingOrder, askPay, onPaid, onDismiss } = useMockPay()
const scenics = ref<Scenic[]>([])
const routesList = ref<TravelRoute[]>([])
const loading = ref(true)

const theme = ref('全部')
const themes = ['全部', '文化体验', '户外徒步', '亲子研学', '节庆限定']
const dayFilter = ref<'all' | 1 | 2 | 3>('all')

const heroImg = img('lusheng instrument Miao festival performance colorful costumes valley, wide banner', 'landscape_16_9')

/* 购票弹窗 */
const buyScenic = ref<Scenic | null>(null)
const buyTicket = ref<{ id: string; name: string; price: number; stock: number } | null>(null)
const useDate = ref('')
const buyQty = ref(2)
const visitorName = ref('')
const visitorPhone = ref('')
const submitting = ref(false)
const buyErr = ref('')

function dayStr(offset: number) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

onMounted(async () => {
  useDate.value = dayStr(3)
  const res = await api.getTrips()
  scenics.value = res.data.scenics
  routesList.value = res.data.routes
  loading.value = false
})

function openBuy(s: Scenic, t: { id: string; name: string; price: number; stock: number }) {
  buyScenic.value = s
  buyTicket.value = t
  buyQty.value = 2
  buyErr.value = ''
}

async function submitBuy() {
  buyErr.value = ''
  if (!visitorName.value.trim()) return (buyErr.value = '请填写游客姓名')
  if (!/^1\d{10}$/.test(visitorPhone.value)) return (buyErr.value = '请填写 11 位手机号')
  submitting.value = true
  try {
    const order = await api.createOrder({
      type: 'TICKET',
      title: `${buyScenic.value!.name} · ${buyTicket.value!.name}`,
      cover: buyScenic.value!.cover,
      summary: `${useDate.value} 入园 · ${buyQty.value} 人 · 凭身份证入园`,
      amount: buyTicket.value!.price * buyQty.value,
      qty: buyQty.value,
      shop: buyScenic.value!.name,
      scenicId: buyScenic.value!.id,
      ticketId: buyTicket.value!.id,
      travelDate: useDate.value,
      contactName: visitorName.value.trim(),
      contactPhone: visitorPhone.value,
    })
    buyScenic.value = null
    askPay(order.data)
  } catch (e) {
    buyErr.value = unwrapError(e).message
  } finally {
    submitting.value = false
  }
}

const filteredRoutes = () =>
  routesList.value.filter(
    (r) =>
      (theme.value === '全部' || r.theme === theme.value) &&
      (dayFilter.value === 'all' || r.days === dayFilter.value),
  )
</script>

<template>
  <div class="trip-page">
    <div class="page-hero">
      <img :src="heroImg" alt="" />
      <div class="ph-text container">
        <em>行 · JOURNEY</em>
        <h1 class="h-display">山水有约，芦笙为引</h1>
        <p>景区门票 · 一日/两日/三日路线 · 苗年限定</p>
      </div>
    </div>

    <!-- 先讲山水与节庆的来路，票种价格往后放 -->
    <CultureBand v-if="culture" :section="culture" />

    <div class="container">
      <!-- 景区门票 -->
      <section class="sec">
        <h2 class="h-display"><AppIcon name="ticket" :size="20" /> 景区门票</h2>
        <div class="scenic-list">
          <div v-for="s in scenics" :key="s.id" class="scenic">
            <img :src="s.cover" :alt="s.name" />
            <div class="sc-body">
              <div class="sc-head">
                <h3>{{ s.name }}</h3>
                <span class="rate">★ {{ s.rating.toFixed(1) }}</span>
              </div>
              <p class="sc-meta">
                <span><AppIcon name="clock" :size="13" /> {{ s.openTime }}</span>
                <span><AppIcon name="location" :size="13" /> {{ s.address }}</span>
              </p>
              <p class="sc-intro">{{ s.intro }}</p>
              <div class="tickets">
                <div v-for="t in s.tickets" :key="t.id" class="ticket">
                  <div>
                    <b>{{ t.name }}</b>
                    <small>{{ t.note }}</small>
                  </div>
                  <div class="t-buy">
                    <span class="price">{{ t.price }}</span>
                    <button class="btn btn-outline" @click="openBuy(s, t)">选购</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 路线 -->
      <section class="sec">
        <h2 class="h-display"><AppIcon name="compass" :size="20" /> 路线套餐</h2>
        <div class="filters">
          <button
            v-for="t in themes"
            :key="t"
            :class="{ on: theme === t }"
            @click="theme = t"
          >
            {{ t }}
          </button>
          <span class="sep"></span>
          <button :class="{ on: dayFilter === 'all' }" @click="dayFilter = 'all'">全部天数</button>
          <button :class="{ on: dayFilter === 1 }" @click="dayFilter = 1">一日</button>
          <button :class="{ on: dayFilter === 2 }" @click="dayFilter = 2">两日</button>
          <button :class="{ on: dayFilter === 3 }" @click="dayFilter = 3">三日</button>
        </div>

        <EmptyState v-if="!loading && !filteredRoutes().length" text="没有符合条件的路线" />
        <div v-else class="route-grid card-grid">
          <RouteCard v-for="(r, i) in filteredRoutes()" :key="r.id" :item="r" class="rise" :style="{ animationDelay: `${Math.min(i, 6) * 60}ms` }" />
        </div>
      </section>

      <p class="tip">
        <b>退票规则</b>：使用日期前 24 小时可退，收 10% 手续费；24 小时内不可退。电子票在「我的订单」中出示二维码核销。
      </p>
    </div>

    <!-- 购票弹窗 -->
    <transition name="pop">
      <div v-if="buyScenic && buyTicket" class="modal-mask" @click.self="buyScenic = null">
        <div class="modal">
          <header>
            <h3>购买门票 · {{ buyScenic.name }}</h3>
            <button class="close" @click="buyScenic = null"><AppIcon name="close" :size="18" /></button>
          </header>

          <div class="chosen">{{ buyTicket.name }} · ¥{{ buyTicket.price }}/张</div>

          <div class="field">
            <label>使用日期</label>
            <input v-model="useDate" type="date" :min="dayStr(1)" />
          </div>

          <div class="field">
            <label>数量</label>
            <div class="qty-row">
              <button @click="buyQty > 1 && buyQty--">−</button>
              <b>{{ buyQty }}</b>
              <button @click="buyQty < 10 && buyQty++">＋</button>
            </div>
          </div>

          <div class="two-col">
            <div class="field">
              <label>游客姓名</label>
              <input v-model="visitorName" placeholder="与身份证一致" />
            </div>
            <div class="field">
              <label>手机号</label>
              <input v-model="visitorPhone" maxlength="11" placeholder="接收电子票" />
            </div>
          </div>

          <div class="amount-row">
            <span>合计</span>
            <span class="price">{{ buyTicket.price * buyQty }}</span>
          </div>

          <p v-if="buyErr" class="err">{{ buyErr }}</p>
          <button class="btn btn-primary btn-lg" style="width: 100%" :disabled="submitting" @click="submitBuy">
            {{ submitting ? '下单中…' : '立即下单' }}
          </button>
        </div>
      </div>
    </transition>

    <!-- 门票下单后立即弹虚拟支付 -->
    <PayDialog :order="pendingOrder" @paid="onPaid" @dismiss="onDismiss" />
  </div>
</template>

<style scoped>
.page-hero {
  position: relative;
  height: 240px;
  overflow: hidden;
  background: var(--indigo-night);
}

.page-hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.85;
}

.ph-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: var(--silver-light);
}

.ph-text em {
  font-style: normal;
  font-size: 11px;
  letter-spacing: 0.5em;
  color: var(--amber);
  margin-bottom: 8px;
}

.ph-text h1 {
  font-size: clamp(24px, 3.4vw, 36px);
  color: #fff;
}

.ph-text p {
  margin-top: 6px;
  font-size: 13px;
  letter-spacing: 0.2em;
  color: rgba(215, 224, 230, 0.75);
}

.sec {
  padding-top: 40px;
}

.sec h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 22px;
  margin-bottom: 20px;
}

.sec h2 :deep(svg) {
  color: var(--accent);
}

.scenic-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.scenic {
  display: grid;
  grid-template-columns: 340px 1fr;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.scenic img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  min-height: 220px;
}

.sc-body {
  padding: 20px 24px;
}

.sc-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.sc-head h3 {
  font-family: var(--font-display);
  font-size: 20px;
}

.rate {
  color: var(--amber);
  font-weight: 700;
}

.sc-meta {
  display: flex;
  gap: 20px;
  margin: 8px 0 10px;
  font-size: 12.5px;
  color: var(--text-2);
}

.sc-meta span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.sc-meta :deep(svg) {
  color: var(--primary);
}

.sc-intro {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.9;
}

.tickets {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.ticket {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius);
  padding: 10px 14px;
  background: var(--paper);
}

.ticket b {
  font-size: 13.5px;
  display: block;
}

.ticket small {
  font-size: 11.5px;
  color: var(--text-3);
}

.t-buy {
  display: flex;
  align-items: center;
  gap: 14px;
}

.t-buy .price {
  font-size: 18px;
}

.t-buy .btn {
  padding: 6px 16px;
  font-size: 12.5px;
}

.filters {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.filters button {
  padding: 6px 16px;
  border-radius: 999px;
  border: 1px solid var(--line-strong);
  font-size: 13px;
  color: var(--text-2);
  background: #fff;
  transition: all 0.2s;
}

.filters button.on {
  background: var(--indigo);
  border-color: var(--indigo);
  color: var(--silver-light);
  font-weight: 600;
}

.sep {
  width: 1px;
  height: 16px;
  background: var(--line-strong);
  margin: 0 6px;
}

.route-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.tip {
  margin-top: 36px;
  padding: 13px 18px;
  background: var(--indigo-mist);
  border-radius: var(--radius);
  font-size: 12.5px;
  color: var(--text-2);
}

.tip b {
  color: var(--primary);
  margin-right: 10px;
}

/* Modal */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 35, 56, 0.55);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  z-index: 2000;
  padding: 20px;
}

.modal {
  width: min(440px, 100%);
  background: var(--paper);
  border-radius: var(--radius-lg);
  padding: 24px 28px;
  border-top: 4px solid var(--accent);
}

.modal header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.modal h3 {
  font-family: var(--font-display);
  font-size: 17px;
}

.close {
  color: var(--text-3);
}

.close:hover {
  color: var(--accent);
}

.chosen {
  background: var(--indigo-mist);
  border-radius: var(--radius);
  padding: 9px 14px;
  font-size: 13px;
  color: var(--primary);
  font-weight: 600;
  margin-bottom: 16px;
}

.field {
  margin-bottom: 14px;
}

.qty-row {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  background: #fff;
  overflow: hidden;
}

.qty-row button {
  width: 32px;
  height: 32px;
  font-size: 15px;
  color: var(--text-2);
}

.qty-row button:hover {
  background: var(--indigo);
  color: #fff;
}

.qty-row b {
  min-width: 40px;
  text-align: center;
  border-inline: 1px solid var(--line);
  align-self: stretch;
  display: grid;
  place-items: center;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 12px;
}

.amount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 2px;
  font-size: 13px;
  color: var(--text-2);
  border-top: 1px dashed var(--line-strong);
}

.amount-row .price {
  font-size: 22px;
}

.err {
  color: var(--accent);
  font-size: 12.5px;
  margin-bottom: 10px;
}

.pop-enter-active,
.pop-leave-active {
  transition: opacity 0.25s;
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
}

@media (max-width: 1023px) {
  .route-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .scenic {
    grid-template-columns: 1fr;
  }

  .scenic img {
    max-height: 220px;
  }
}

@media (max-width: 599px) {
  .route-grid {
    grid-template-columns: 1fr;
  }
}
</style>
