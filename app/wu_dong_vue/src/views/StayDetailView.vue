<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as api from '@/api'
import { unwrapError } from '@/api'
import type { Homestay, RoomType } from '@/types'
import { useUserStore } from '@/stores/user'
import { useFavoriteStore } from '@/stores/favorite'
import EmptyState from '@/components/EmptyState.vue'
import AppIcon from '@/components/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const favStore = useFavoriteStore()

const stay = ref<Homestay | null>(null)
const notFound = ref(false)
const curImg = ref(0)
const favorited = ref(false)

const checkIn = ref('')
const checkOut = ref('')
const openRoom = ref<RoomType | null>(null)
const calendar = ref<{ date: string; stock: number; priceDelta: number }[]>([])
const guestName = ref('')
const guestPhone = ref('')
const submitting = ref(false)
const bookErr = ref('')

function dayStr(offset: number) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

const nights = computed(() => {
  const a = new Date(checkIn.value).getTime()
  const b = new Date(checkOut.value).getTime()
  return Math.max(1, Math.round((b - a) / 86400000) || 1)
})

onMounted(async () => {
  checkIn.value = dayStr(1)
  checkOut.value = dayStr(2)
  try {
    const res = await api.getHomestayDetail(route.params.id as string)
    stay.value = res.data
    favorited.value = api.isFavorite(res.data.id)
  } catch {
    notFound.value = true
  }
})

async function toggleFav() {
  favorited.value = await favStore.toggle(stay.value!.id)
  userStore.toast(favorited.value ? '已收藏民宿' : '已取消收藏')
}

async function openCalendar(room: RoomType) {
  openRoom.value = room
  const res = await api.getRoomCalendar(room.id)
  calendar.value = res.data
}

function stockOf(date: string) {
  return calendar.value.find((c) => c.date === date)?.stock ?? 0
}

async function bookRoom() {
  bookErr.value = ''
  if (!guestName.value.trim()) return (bookErr.value = '请填写入住人姓名')
  if (!/^1\d{10}$/.test(guestPhone.value)) return (bookErr.value = '请填写 11 位手机号')
  if (nights.value > 1 && calendar.value.some((c) => c.date >= checkIn.value && c.date < checkOut.value && c.stock === 0)) {
    return (bookErr.value = '所选日期中存在满房，请调整日期')
  }
  submitting.value = true
  try {
    const room = openRoom.value!
    const order = await api.createOrder({
      type: 'LODGING',
      title: `${stay.value!.name} · ${room.name}`,
      cover: stay.value!.cover,
      summary: `${checkIn.value} 入住 · ${checkOut.value} 离店 · ${nights.value} 晚 · ${guestName.value}`,
      amount: (room.price + (calendar.value.find((c) => c.date === checkIn.value)?.priceDelta || 0)) * nights.value,
      qty: nights.value,
      shop: stay.value!.name,
    })
    openRoom.value = null
    router.push({ path: '/orders', query: { highlight: order.data.orderNo, pay: '1' } })
  } catch (e) {
    bookErr.value = unwrapError(e).message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="sd-page container">
    <EmptyState v-if="notFound" text="民宿不存在或已歇业">
      <router-link to="/stay" class="btn btn-outline">回到住馆</router-link>
    </EmptyState>

    <template v-else-if="stay">
      <nav class="crumbs">
        <router-link to="/">首页</router-link><span>/</span>
        <router-link to="/stay">山居民宿</router-link><span>/</span>
        <b>{{ stay.name }}</b>
      </nav>

      <div class="head-row">
        <div>
          <h1>{{ stay.name }}</h1>
          <div class="sub-row">
            <span class="score">★ {{ stay.rating.toFixed(1) }}</span>
            <span class="score-d">卫生 {{ stay.score.hygiene }} · 位置 {{ stay.score.location }} · 服务 {{ stay.score.service }}</span>
          </div>
        </div>
        <button class="fav" :class="{ on: favorited }" @click="toggleFav">
          <AppIcon name="heart" :size="16" /> {{ favorited ? '已收藏' : '收藏' }}
        </button>
      </div>

      <div class="gallery">
        <div
          v-for="(im, i) in stay.images.slice(0, 4)"
          :key="i"
          class="g-item"
          :class="{ big: i === 0 }"
          @mouseenter="curImg = i"
        >
          <img :src="im" :alt="`${stay.name} 图 ${i + 1}`" :class="{ dim: curImg !== i && stay.images.length > 1 }" />
        </div>
      </div>

      <div class="cols">
        <div class="main">
          <div class="tags">
            <span v-for="t in stay.tags" :key="t" class="tag tag-red">{{ t }}</span>
          </div>
          <p class="intro">{{ stay.intro }}</p>

          <section class="block">
            <h3><AppIcon name="bed" :size="16" /> 房型与预订</h3>
            <div class="rooms">
              <div v-for="r in stay.rooms" :key="r.id" class="room">
                <img :src="r.cover" :alt="r.name" />
                <div class="r-info">
                  <b>{{ r.name }}</b>
                  <span>{{ r.bed }} · {{ r.area }}㎡ · 限住 {{ r.maxGuests }} 人</span>
                  <div class="r-fac">
                    <i v-for="f in r.facilities" :key="f">{{ f }}</i>
                  </div>
                </div>
                <div class="r-action">
                  <span class="price">{{ r.price }}<em>/晚</em></span>
                  <small :class="{ low: r.stock <= 2 }">余 {{ r.stock }} 间</small>
                  <button class="btn btn-primary" @click="openCalendar(r)">选日期</button>
                </div>
              </div>
            </div>
          </section>

          <section class="block">
            <h3><AppIcon name="check" :size="16" /> 设施与服务</h3>
            <div class="fac-list">
              <i v-for="f in stay.facilities" :key="f"><AppIcon name="check" :size="12" />{{ f }}</i>
            </div>
          </section>

          <section class="block">
            <h3><AppIcon name="message" :size="16" /> 住客评价（{{ stay.reviews.length }}）</h3>
            <EmptyState v-if="!stay.reviews.length" text="还没有评价" />
            <div v-for="r in stay.reviews" :key="r.id" class="review">
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
        </div>

        <aside class="side">
          <div class="side-card">
            <h4>入住须知</h4>
            <p>{{ stay.notice }}</p>
            <h4>取消政策</h4>
            <p>入住前 3 天免费取消；1-3 天收 30%；当天不可退。</p>
            <h4>位置</h4>
            <p><AppIcon name="location" :size="13" /> {{ stay.address }}</p>
          </div>
        </aside>
      </div>
    </template>

    <!-- 日历 + 预订弹窗 -->
    <transition name="pop">
      <div v-if="openRoom" class="modal-mask" @click.self="openRoom = null">
        <div class="modal">
          <header>
            <h3>{{ openRoom.name }}</h3>
            <button class="close" @click="openRoom = null"><AppIcon name="close" :size="18" /></button>
          </header>

          <div class="date-row">
            <div class="field">
              <label>入住</label>
              <input v-model="checkIn" type="date" :min="dayStr(0)" />
            </div>
            <div class="field">
              <label>离店</label>
              <input v-model="checkOut" type="date" :min="checkIn" />
            </div>
            <div class="nights">共 {{ nights }} 晚</div>
          </div>

          <div class="cal">
            <div v-for="c in calendar" :key="c.date" class="cell" :class="{ off: c.stock === 0, weekend: [0, 6].includes(new Date(c.date).getDay()) }">
              <b>{{ Number(c.date.slice(8)) }}</b>
              <small>{{ c.stock === 0 ? '满' : `¥${openRoom.price + c.priceDelta}` }}</small>
            </div>
          </div>
          <p class="cal-hint">周末上浮 ¥60；灰色为满房</p>

          <div class="two-col">
            <div class="field">
              <label>入住人</label>
              <input v-model="guestName" placeholder="与身份证一致" />
            </div>
            <div class="field">
              <label>手机号</label>
              <input v-model="guestPhone" maxlength="11" placeholder="11 位手机号" />
            </div>
          </div>

          <div class="amount-row">
            <span>{{ openRoom.price }} × {{ nights }} 晚</span>
            <span class="price">{{ openRoom.price * nights }}</span>
          </div>

          <p v-if="bookErr" class="err">{{ bookErr }}</p>
          <button class="btn btn-primary btn-lg" style="width: 100%" :disabled="submitting" @click="bookRoom">
            {{ submitting ? '预订中…' : '确认预订（预付房费）' }}
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.sd-page {
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

.head-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.head-row h1 {
  font-family: var(--font-display);
  font-size: 28px;
  color: var(--ink);
}

.sub-row {
  display: flex;
  align-items: baseline;
  gap: 14px;
  margin-top: 6px;
}

.score {
  color: var(--amber);
  font-weight: 700;
  font-family: var(--font-display);
}

.score-d {
  font-size: 12px;
  color: var(--text-3);
}

.fav {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-2);
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  padding: 7px 16px;
  transition: all 0.2s;
}

.fav.on {
  color: var(--accent);
  border-color: rgba(181, 68, 46, 0.5);
  background: rgba(181, 68, 46, 0.05);
}

.gallery {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: 150px 150px;
  gap: 10px;
  margin-top: 20px;
}

.g-item {
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--indigo-mist);
  cursor: pointer;
}

.g-item.big {
  grid-row: 1 / 3;
}

.g-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s var(--ease), opacity 0.3s;
}

.g-item:hover img {
  transform: scale(1.04);
  opacity: 1 !important;
}

.g-item img.dim {
  opacity: 0.75;
}

.cols {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 34px;
  margin-top: 30px;
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
}

.block {
  margin-top: 30px;
}

.block h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-display);
  font-size: 18px;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line);
}

.block h3 :deep(svg) {
  color: var(--accent);
}

.rooms {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.room {
  display: grid;
  grid-template-columns: 150px 1fr auto;
  gap: 16px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 12px;
  align-items: center;
}

.room img {
  width: 100%;
  height: 104px;
  object-fit: cover;
  border-radius: var(--radius);
}

.r-info b {
  font-size: 15px;
}

.r-info > span {
  display: block;
  font-size: 12.5px;
  color: var(--text-2);
  margin: 5px 0;
}

.r-fac {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.r-fac i {
  font-style: normal;
  font-size: 11px;
  color: var(--text-2);
  background: var(--indigo-mist);
  padding: 1px 8px;
  border-radius: 3px;
}

.r-action {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
}

.r-action .price {
  font-size: 20px;
}

.r-action .price em {
  font-style: normal;
  font-size: 11px;
  color: var(--text-3);
}

.r-action small {
  color: #3d6b4f;
  font-size: 11.5px;
}

.r-action small.low {
  color: var(--accent);
  font-weight: 700;
}

.fac-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.fac-list i {
  font-style: normal;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-2);
  background: #fff;
  border: 1px dashed var(--line);
  border-radius: var(--radius);
  padding: 9px 12px;
}

.fac-list :deep(svg) {
  color: var(--amber);
}

.reviews .review {
  display: flex;
  gap: 14px;
  padding: 15px 0;
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

.reviews p {
  margin-top: 6px;
  font-size: 14px;
  line-height: 1.9;
}

.side-card {
  position: sticky;
  top: 84px;
  background: var(--indigo-deep);
  color: rgba(215, 224, 230, 0.85);
  border-radius: var(--radius-lg);
  padding: 22px 24px;
}

.side-card h4 {
  font-size: 13px;
  letter-spacing: 0.25em;
  color: var(--amber);
  margin-bottom: 8px;
}

.side-card h4 + p {
  font-size: 13px;
  line-height: 1.9;
  margin-bottom: 18px;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.side-card p {
  font-size: 13px;
  line-height: 1.9;
  margin-bottom: 18px;
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
  width: min(520px, 100%);
  background: var(--paper);
  border-radius: var(--radius-lg);
  padding: 24px 28px;
  max-height: 88vh;
  overflow: auto;
  border-top: 4px solid var(--accent);
}

.modal header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.modal h3 {
  font-family: var(--font-display);
}

.close {
  color: var(--text-3);
}

.close:hover {
  color: var(--accent);
}

.date-row {
  display: flex;
  align-items: flex-end;
  gap: 14px;
  margin-bottom: 16px;
}

.date-row .field {
  margin-bottom: 0;
  flex: 1;
}

.nights {
  font-size: 13px;
  color: var(--primary);
  font-weight: 700;
  padding-bottom: 9px;
}

.cal {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 5px;
}

.cell {
  border: 1px solid var(--line);
  border-radius: 5px;
  text-align: center;
  padding: 6px 0 4px;
  background: #fff;
}

.cell b {
  font-size: 12.5px;
  display: block;
}

.cell small {
  font-size: 10px;
  color: var(--text-3);
}

.cell.weekend small {
  color: var(--amber);
}

.cell.off {
  background: var(--paper-2);
  color: var(--text-3);
  opacity: 0.55;
}

.cal-hint {
  font-size: 11px;
  color: var(--text-3);
  margin: 8px 0 16px;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
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
  margin-top: 8px;
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
  .cols {
    grid-template-columns: 1fr;
  }

  .gallery {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: 160px 160px;
  }

  .cal {
    grid-template-columns: repeat(6, 1fr);
  }
}

@media (max-width: 599px) {
  .room {
    grid-template-columns: 1fr;
  }

  .room img {
    height: 160px;
  }

  .fac-list {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
