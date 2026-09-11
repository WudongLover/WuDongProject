<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import * as api from '@/api'
import { unwrapError } from '@/api'
import type { TravelRoute } from '@/types'
import { useUserStore } from '@/stores/user'
import { useFavoriteStore } from '@/stores/favorite'
import { useMockPay } from '@/composables/useMockPay'
import EmptyState from '@/components/EmptyState.vue'
import AppIcon from '@/components/AppIcon.vue'
import PayDialog from '@/components/PayDialog.vue'

const route = useRoute()
const userStore = useUserStore()
const favoriteStore = useFavoriteStore()
// 路线下单后立即弹虚拟支付
const { pendingOrder, askPay, onPaid, onDismiss } = useMockPay()

const routeData = ref<TravelRoute | null>(null)
const notFound = ref(false)
const guests = ref(2)
const departDate = ref('')
const visitorName = ref('')
const visitorPhone = ref('')
const submitting = ref(false)
const errText = ref('')
const favorited = ref(false)

function dayStr(offset: number) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

onMounted(async () => {
  departDate.value = dayStr(7)
  try {
    const res = await api.getRouteDetail(route.params.id as string)
    routeData.value = res.data
    if (userStore.isLoggedIn) {
      const fav = await api.checkFavorite('ROUTE', routeData.value.id)
      favorited.value = fav.data.favorited
    }
  } catch {
    notFound.value = true
  }
})

async function book() {
  errText.value = ''
  if (!visitorName.value.trim()) return (errText.value = '请填写联系人姓名')
  if (!/^1\d{10}$/.test(visitorPhone.value)) return (errText.value = '请填写 11 位手机号')
  submitting.value = true
  try {
    const order = await api.createOrder({
      type: 'ROUTE',
      title: routeData.value!.title,
      cover: routeData.value!.cover,
      summary: `${departDate.value} 出发 · ${guests.value} 人 · ${routeData.value!.departure}`,
      amount: routeData.value!.price * guests.value,
      qty: guests.value,
      shop: '乌东旅行社',
      routeId: routeData.value!.id,
      travelDate: departDate.value,
      contactName: visitorName.value.trim(),
      contactPhone: visitorPhone.value,
    })
    askPay(order.data)
  } catch (e) {
    errText.value = unwrapError(e).message
  } finally {
    submitting.value = false
  }
}

async function toggleFavorite() {
  if (!userStore.requireLogin()) return
  try {
    favorited.value = await favoriteStore.toggle('ROUTE', routeData.value!.id)
    userStore.toast(favorited.value ? '已收藏路线' : '已取消收藏')
  } catch (e) {
    userStore.toast(unwrapError(e).message)
  }
}
</script>

<template>
  <div class="td-page container">
    <EmptyState v-if="notFound" text="路线不存在或已停售">
      <router-link to="/trip" class="btn btn-outline">回到行馆</router-link>
    </EmptyState>

    <template v-else-if="routeData">
      <nav class="crumbs">
        <router-link to="/">首页</router-link><span>/</span>
        <router-link to="/trip">门票路线</router-link><span>/</span>
        <b>{{ routeData.title }}</b>
      </nav>

      <div class="hero">
        <img :src="routeData.cover" :alt="routeData.title" />
        <div class="hero-info">
          <span class="theme">{{ routeData.theme }} · {{ routeData.days === 1 ? '一日游' : routeData.days === 2 ? '两日游' : `${routeData.days}日游` }}</span>
          <h1>{{ routeData.title }}</h1>
          <p class="meta">
            <span>★ {{ routeData.rating.toFixed(1) }}</span>
            <span>已售 {{ routeData.sales }}</span>
            <span><AppIcon name="location" :size="13" /> {{ routeData.departure }}</span>
          </p>
        </div>
      </div>

      <div class="cols">
        <div class="main">
          <!-- 行程安排 -->
          <section class="block">
            <h3>行程安排</h3>
            <div class="timeline">
              <div v-for="d in routeData.schedule" :key="d.day" class="tl-item">
                <div class="tl-node">
                  <b>D{{ d.day }}</b>
                </div>
                <div class="tl-body">
                  <h4>{{ d.title }}</h4>
                  <p>{{ d.desc }}</p>
                  <div class="tl-meta">
                    <span><AppIcon name="food" :size="13" /> 用餐：{{ d.meals }}</span>
                    <span><AppIcon name="bed" :size="13" /> 住宿：{{ d.stay }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section class="two-block">
            <div class="incl">
              <h3>费用包含</h3>
              <ul>
                <li v-for="i in routeData.includes" :key="i"><AppIcon name="check" :size="13" />{{ i }}</li>
              </ul>
            </div>
            <div class="notice">
              <h3>注意事项</h3>
              <ul>
                <li v-for="(n, i) in routeData.notice" :key="i"><i>{{ i + 1 }}</i>{{ n }}</li>
              </ul>
            </div>
          </section>
        </div>

        <!-- 预订侧栏 -->
        <aside class="side">
          <div class="book-card">
            <div class="price-row">
              <span class="price">{{ routeData.price }}</span>
              <em>/人起</em>
            </div>
            <button class="route-fav" :class="{ on: favorited }" @click="toggleFavorite">
              <AppIcon name="heart" :size="15" /> {{ favorited ? '已收藏路线' : '收藏路线' }}
            </button>
            <div class="field">
              <label>出发日期</label>
              <input v-model="departDate" type="date" :min="dayStr(1)" />
            </div>
            <div class="field">
              <label>出行人数</label>
              <div class="qty-row">
                <button @click="guests > 1 && guests--">−</button>
                <b>{{ guests }}</b>
                <button @click="guests < 12 && guests++">＋</button>
              </div>
            </div>
            <div class="field">
              <label>联系人</label>
              <input v-model="visitorName" placeholder="姓名" />
            </div>
            <div class="field">
              <label>手机号</label>
              <input v-model="visitorPhone" maxlength="11" placeholder="接收出团通知" />
            </div>
            <div class="amount-row">
              <span>合计</span>
              <span class="price">{{ routeData.price * guests }}</span>
            </div>
            <p v-if="errText" class="err">{{ errText }}</p>
            <button class="btn btn-primary btn-lg" style="width: 100%" :disabled="submitting" @click="book">
              {{ submitting ? '下单中…' : '立即预订' }}
            </button>
            <p class="hint">最少提前 1 天预订 · 6 人成团，未成团全额退</p>
          </div>
        </aside>
      </div>
    </template>

    <!-- 路线下单后立即弹虚拟支付 -->
    <PayDialog :order="pendingOrder" @paid="onPaid" @dismiss="onDismiss" />
  </div>
</template>

<style scoped>
.td-page {
  padding-top: 26px;
}

.crumbs {
  display: flex;
  gap: 8px;
  font-size: 12.5px;
  color: var(--text-3);
  margin-bottom: 18px;
}

.crumbs b { color: var(--text-2); font-weight: 500; }
.crumbs a:hover { color: var(--primary); }

.hero {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  height: 340px;
}

.hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-info {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 26px 34px;
  background: linear-gradient(transparent, rgba(15, 35, 56, 0.85));
  color: var(--silver-light);
}

.theme {
  display: inline-block;
  font-size: 12px;
  letter-spacing: 0.2em;
  color: var(--amber);
  border: 1px solid rgba(192, 138, 45, 0.6);
  border-radius: 999px;
  padding: 2px 12px;
  margin-bottom: 10px;
}

.hero-info h1 {
  font-family: var(--font-display);
  font-size: clamp(22px, 3vw, 32px);
  color: #fff;
}

.meta {
  display: flex;
  gap: 20px;
  margin-top: 8px;
  font-size: 13px;
  color: rgba(215, 224, 230, 0.8);
}

.meta span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.cols {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 34px;
  margin-top: 32px;
  align-items: start;
}

.block h3,
.two-block h3 {
  font-family: var(--font-display);
  font-size: 19px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 20px;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.tl-item {
  display: grid;
  grid-template-columns: 52px 1fr;
  gap: 18px;
  position: relative;
  padding-bottom: 28px;
}

.tl-item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 25px;
  top: 44px;
  bottom: 0;
  width: 2px;
  background: repeating-linear-gradient(180deg, var(--line-strong) 0 6px, transparent 6px 12px);
}

.tl-node b {
  width: 52px;
  height: 44px;
  display: grid;
  place-items: center;
  background: var(--indigo);
  color: var(--silver-light);
  font-family: var(--font-display);
  font-size: 16px;
  border-radius: var(--radius);
  position: relative;
  z-index: 1;
}

.tl-body {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
}

.tl-body h4 {
  font-size: 15.5px;
  color: var(--ink);
}

.tl-body p {
  margin: 7px 0 10px;
  font-size: 13.5px;
  color: var(--text-2);
  line-height: 1.9;
}

.tl-meta {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: var(--text-3);
}

.tl-meta span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.tl-meta :deep(svg) {
  color: var(--primary);
}

.two-block {
  margin-top: 36px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.incl ul {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.incl li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  color: var(--text);
}

.incl :deep(svg) {
  color: var(--amber);
}

.notice ul {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.notice li {
  display: flex;
  gap: 9px;
  font-size: 13.5px;
  color: var(--text-2);
  line-height: 1.7;
}

.notice li i {
  font-style: normal;
  width: 18px;
  height: 18px;
  flex: none;
  display: grid;
  place-items: center;
  font-size: 11px;
  background: var(--indigo-mist);
  color: var(--primary);
  border-radius: 50%;
  margin-top: 3px;
}

.book-card {
  position: sticky;
  top: 84px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-1);
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 18px;
}

.price-row .price {
  font-size: 34px;
}

.price-row em {
  font-style: normal;
  font-size: 12px;
  color: var(--text-3);
}

.route-fav {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 16px;
  color: var(--primary);
  font-size: 13px;
}

.route-fav.on {
  color: var(--accent);
}

.field {
  margin-bottom: 13px;
}

.qty-row {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  overflow: hidden;
  background: #fff;
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

.amount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 2px;
  font-size: 13px;
  color: var(--text-2);
  border-top: 1px dashed var(--line-strong);
  margin-top: 6px;
}

.amount-row .price {
  font-size: 24px;
}

.err {
  color: var(--accent);
  font-size: 12.5px;
  margin-bottom: 10px;
}

.hint {
  text-align: center;
  font-size: 11.5px;
  color: var(--text-3);
  margin-top: 12px;
}

@media (max-width: 1023px) {
  .cols {
    grid-template-columns: 1fr;
  }

  .book-card {
    position: static;
  }

  .two-block {
    grid-template-columns: 1fr;
  }
}
</style>
