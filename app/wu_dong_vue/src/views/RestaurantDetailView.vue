<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as api from '@/api'
import { unwrapError } from '@/api'
import { getRestaurantDetail } from '@/api/food'
import type { Restaurant } from '@/types'
import { useUserStore } from '@/stores/user'
import QtyStepper from '@/components/QtyStepper.vue'
import EmptyState from '@/components/EmptyState.vue'
import AppIcon from '@/components/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const rest = ref<Restaurant | null>(null)
const notFound = ref(false)
const curImg = ref(0)
const showBook = ref(false)

/* 预订表单 */
const bookDate = ref('')
const slotId = ref('')
const guests = ref(4)
const contact = ref('')
const phoneTail = ref('')
const remark = ref('')
const submitting = ref(false)
const bookErr = ref('')

const slot = computed(() => rest.value?.slots.find((s) => s.id === slotId.value))

function todayStr(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

onMounted(async () => {
  bookDate.value = todayStr(1)
  try {
    const res = await getRestaurantDetail(route.params.id as string)
    rest.value = res.data
    slotId.value = res.data.slots[0]?.id || ''
  } catch {
    notFound.value = true
  }
})

async function submitBooking() {
  bookErr.value = ''
  if (!contact.value.trim()) return (bookErr.value = '请填写联系人姓名')
  if (!/^1\d{10}$/.test(phoneTail.value)) return (bookErr.value = '请填写 11 位手机号')
  submitting.value = true
  try {
    const order = await api.createOrder({
      type: 'MEAL',
      title: `${rest.value!.name} · 餐位预订`,
      cover: rest.value!.cover,
      summary: `${bookDate.value} ${slot.value?.name} · ${guests.value} 人 · ${contact.value}`,
      amount: rest.value!.pricePerCapita * guests.value,
      qty: guests.value,
      shop: rest.value!.name,
      // 写 wudong_m2_order_ext 的预订参数（后端 dining_date 列 NOT NULL）
      restaurantId: rest.value!.id,
      slotId: slotId.value,
      diningDate: bookDate.value,
      diningTime: slot.value?.name || '',
      guests: guests.value,
      contactName: contact.value.trim(),
      contactPhone: phoneTail.value,
    })
    showBook.value = false
    router.push({ path: '/orders', query: { highlight: order.data.orderNo, pay: '1' } })
  } catch (e) {
    bookErr.value = unwrapError(e).message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="rd-page container">
    <EmptyState v-if="notFound" text="餐厅不存在或已歇业">
      <router-link to="/food" class="btn btn-outline">回到食馆</router-link>
    </EmptyState>

    <template v-else-if="rest">
      <nav class="crumbs">
        <router-link to="/">首页</router-link><span>/</span>
        <router-link to="/food">苗家风味</router-link><span>/</span>
        <b>{{ rest.name }}</b>
      </nav>

      <div class="rd-head">
        <div class="gallery">
          <div class="main-img"><img :src="rest.images[curImg]" :alt="rest.name" /></div>
          <div v-if="rest.images.length > 1" class="thumbs">
            <button
              v-for="(im, i) in rest.images"
              :key="i"
              :class="{ on: i === curImg }"
              @click="curImg = i"
            >
              <img :src="im" alt="" />
            </button>
          </div>
        </div>

        <div class="info">
          <h1>{{ rest.name }}</h1>
          <div class="rate-row">
            <span class="rate">★ {{ rest.rating.toFixed(1) }}</span>
            <span class="pp">¥{{ rest.pricePerCapita }}<i>/人均</i></span>
            <span class="cap">可容纳 {{ rest.capacity }} 人</span>
          </div>
          <div class="tags">
            <span v-for="t in rest.tags" :key="t" class="tag tag-red">{{ t }}</span>
          </div>
          <p class="intro">{{ rest.intro }}</p>
          <ul class="meta-list">
            <li><AppIcon name="location" :size="15" /> {{ rest.address }}</li>
            <li><AppIcon name="clock" :size="15" /> 营业时间 {{ rest.hours }}</li>
          </ul>
          <button class="btn btn-primary btn-lg book-btn" @click="showBook = true">
            <AppIcon name="calendar" :size="17" /> 预订餐位
          </button>
        </div>
      </div>

      <!-- 招牌菜 -->
      <section class="dishes">
        <h2 class="h-display">招牌与灶上</h2>
        <div class="dish-grid">
          <div v-for="d in rest.dishes" :key="d.id" class="dish">
            <img :src="d.img" :alt="d.name" loading="lazy" />
            <div class="d-body">
              <b>{{ d.name }} <i v-if="d.signature" class="sig">招牌</i></b>
              <span class="price">{{ d.price }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 评价 -->
      <section class="revs">
        <h2 class="h-display">食客说</h2>
        <EmptyState v-if="!rest.reviews.length" text="还没有评价" />
        <div v-for="r in rest.reviews" :key="r.id" class="review">
          <img class="r-avatar" :src="r.avatar" :alt="r.user" />
          <div>
            <div class="r-head">
              <b>{{ r.user }}</b>
              <span class="r-stars"><i v-for="n in 5" :key="n" :class="{ fill: n <= r.rating }">★</i></span>
              <time>{{ r.date }}</time>
            </div>
            <p>{{ r.content }}</p>
          </div>
        </div>
      </section>
    </template>

    <!-- 预订弹窗 -->
    <transition name="pop">
      <div v-if="showBook && rest" class="modal-mask" @click.self="showBook = false">
        <div class="modal">
          <header>
            <h3>预订餐位 · {{ rest.name }}</h3>
            <button class="close" @click="showBook = false"><AppIcon name="close" :size="18" /></button>
          </header>

          <div class="field">
            <label>用餐日期</label>
            <input v-model="bookDate" type="date" :min="todayStr()" :max="todayStr(30)" />
          </div>

          <div class="field">
            <label>时段</label>
            <div class="slots">
              <button
                v-for="s in rest.slots"
                :key="s.id"
                :class="{ on: s.id === slotId }"
                :disabled="s.left === 0"
                @click="slotId = s.id"
              >
                {{ s.name }}
                <small>{{ s.left === 0 ? '已满' : `余 ${s.left} 桌` }}</small>
              </button>
            </div>
          </div>

          <div class="field">
            <label>人数</label>
            <QtyStepper v-model="guests" :max="12" :min="1" />
          </div>

          <div class="two-col">
            <div class="field">
              <label>联系人</label>
              <input v-model="contact" placeholder="姓名" />
            </div>
            <div class="field">
              <label>手机号</label>
              <input v-model="phoneTail" maxlength="11" placeholder="用于接收确认短信" />
            </div>
          </div>

          <div class="field">
            <label>备注（口味 / 忌口 / 生日布置）</label>
            <textarea v-model="remark" rows="2" placeholder="选填"></textarea>
          </div>

          <div class="amount-row">
            <span>预计费用（人均 ¥{{ rest.pricePerCapita }}）</span>
            <span class="price">{{ rest.pricePerCapita * guests }}</span>
          </div>

          <p v-if="bookErr" class="err">{{ bookErr }}</p>

          <button class="btn btn-primary btn-lg" style="width: 100%" :disabled="submitting" @click="submitBooking">
            {{ submitting ? '提交中…' : '提交预订' }}
          </button>
          <p class="hint">到店前 24 小时可免费取消；24 小时内取消扣 50%</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.rd-page {
  padding-top: 26px;
}

.crumbs {
  display: flex;
  gap: 8px;
  font-size: 12.5px;
  color: var(--text-3);
  margin-bottom: 20px;
}

.crumbs b { color: var(--text-2); font-weight: 500; }
.crumbs a:hover { color: var(--primary); }

.rd-head {
  display: grid;
  grid-template-columns: minmax(0, 6fr) minmax(0, 5fr);
  gap: 36px;
  align-items: start;
}

.main-img {
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--line);
}

.main-img img {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
}

.thumbs {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.thumbs button {
  width: 92px;
  border-radius: var(--radius);
  overflow: hidden;
  border: 2px solid transparent;
  opacity: 0.7;
}

.thumbs button.on {
  border-color: var(--accent);
  opacity: 1;
}

.info h1 {
  font-family: var(--font-display);
  font-size: 30px;
  color: var(--ink);
}

.rate-row {
  display: flex;
  align-items: baseline;
  gap: 16px;
  margin: 12px 0;
}

.rate {
  color: var(--amber);
  font-weight: 700;
  font-family: var(--font-display);
  font-size: 18px;
}

.pp {
  font-family: var(--font-display);
  color: var(--accent);
  font-weight: 700;
}

.pp i {
  font-style: normal;
  font-size: 11px;
  color: var(--text-3);
  font-weight: 400;
}

.cap {
  font-size: 12.5px;
  color: var(--text-3);
}

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.intro {
  margin-top: 14px;
  font-size: 14px;
  line-height: 2;
  color: var(--text);
}

.meta-list {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-2);
}

.meta-list :deep(svg) {
  color: var(--primary);
  flex: none;
}

.book-btn {
  margin-top: 22px;
}

section.dishes,
section.revs {
  margin-top: 46px;
}

section h2 {
  font-size: 22px;
  margin-bottom: 20px;
}

.dish-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.dish {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: transform 0.3s var(--ease), box-shadow 0.3s;
}

.dish:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-1);
}

.dish img {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
}

.d-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 11px 13px;
}

.d-body b {
  font-size: 13px;
  color: var(--ink);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sig {
  font-style: normal;
  font-size: 10px;
  background: var(--accent);
  color: #fff;
  border-radius: 3px;
  padding: 1px 5px;
  margin-left: 6px;
  vertical-align: 1px;
}

.d-body .price {
  font-size: 16px;
  flex: none;
}

.revs .review {
  display: flex;
  gap: 14px;
  padding: 16px 0;
  border-bottom: 1px dashed var(--line);
}

.r-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.r-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.r-stars i {
  font-style: normal;
  color: rgba(35, 69, 107, 0.2);
  font-size: 12px;
}

.r-stars i.fill {
  color: var(--amber);
}

.r-head time {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-3);
}

.r-head + p,
.revs p {
  margin-top: 6px;
  font-size: 14px;
  line-height: 1.9;
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
  width: min(460px, 100%);
  background: var(--paper);
  border-radius: var(--radius-lg);
  padding: 24px 28px;
  max-height: 88vh;
  overflow: auto;
  box-shadow: var(--shadow-2);
  border-top: 4px solid var(--accent);
}

.modal header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.modal h3 {
  font-family: var(--font-display);
  font-size: 18px;
  letter-spacing: 0.05em;
}

.close {
  color: var(--text-3);
}

.close:hover {
  color: var(--accent);
}

.field {
  margin-bottom: 14px;
}

.slots {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

.slots button {
  border: 1.5px solid var(--line-strong);
  border-radius: var(--radius);
  padding: 8px 13px;
  font-size: 13px;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  transition: all 0.2s;
}

.slots button small {
  font-size: 10.5px;
  color: var(--text-3);
}

.slots button.on {
  border-color: var(--accent);
  color: var(--accent);
  font-weight: 700;
  background: rgba(181, 68, 46, 0.05);
}

.slots button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
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
  margin-top: 4px;
}

.amount-row .price {
  font-size: 22px;
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

.pop-enter-active,
.pop-leave-active {
  transition: opacity 0.25s;
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
}

@media (max-width: 1023px) {
  .rd-head {
    grid-template-columns: 1fr;
  }

  .dish-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 599px) {
  .dish-grid {
    grid-template-columns: 1fr;
  }
}
</style>
