<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as api from '@/api'
import type { Homestay } from '@/types'
import HomestayCard from '@/components/HomestayCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import { img } from '@/mock/images'
import AppIcon from '@/components/AppIcon.vue'

const homestays = ref<Homestay[]>([])
const loading = ref(true)

const checkIn = ref('')
const checkOut = ref('')
const guests = ref(2)

const styleTags = ['全部', '吊脚楼', '设计感', '亲子友好', '观云海']
const styleTag = ref('全部')
const facility = ref('不限')
const facilities = ['不限', 'WiFi', '空调', '独立卫浴', '观景露台', 'spa']

const heroImg = img('Miao wooden stilt houses guesthouse on terraced hillside at dusk warm windows, wide banner', 'landscape_16_9')

function initDates() {
  const d1 = new Date()
  d1.setDate(d1.getDate() + 1)
  const d2 = new Date()
  d2.setDate(d2.getDate() + 2)
  checkIn.value = d1.toISOString().slice(0, 10)
  checkOut.value = d2.toISOString().slice(0, 10)
}

function nights() {
  const a = new Date(checkIn.value).getTime()
  const b = new Date(checkOut.value).getTime()
  return Math.max(1, Math.round((b - a) / 86400000)) || 1
}

onMounted(async () => {
  initDates()
  const res = await api.getHomestays()
  homestays.value = res.data
  loading.value = false
})
</script>

<template>
  <div class="stay-page">
    <div class="page-hero">
      <img :src="heroImg" alt="" />
      <div class="ph-text container">
        <em>住 · MOUNTAIN LODGE</em>
        <h1 class="h-display">推开窗，就是云海与梯田</h1>
      </div>

      <!-- 搜索条 -->
      <div class="search-bar container">
        <div class="sb-item">
          <label><AppIcon name="calendar" :size="13" /> 入住</label>
          <input v-model="checkIn" type="date" :min="new Date().toISOString().slice(0, 10)" />
        </div>
        <div class="sb-item">
          <label><AppIcon name="calendar" :size="13" /> 离店</label>
          <input v-model="checkOut" type="date" />
        </div>
        <div class="sb-item">
          <label><AppIcon name="user" :size="13" /> 人数</label>
          <select v-model.number="guests">
            <option v-for="n in 6" :key="n" :value="n">{{ n }} 人</option>
          </select>
        </div>
        <span class="nights">{{ nights() }} 晚</span>
        <button class="btn btn-primary">搜索民宿</button>
      </div>
    </div>

    <div class="container">
      <div class="filter-row">
        <div class="fr-group">
          <span>风格</span>
          <button
            v-for="t in styleTags"
            :key="t"
            :class="{ on: styleTag === t }"
            @click="styleTag = t"
          >
            {{ t }}
          </button>
        </div>
        <div class="fr-group">
          <span>设施</span>
          <select v-model="facility">
            <option v-for="f in facilities" :key="f" :value="f">{{ f }}</option>
          </select>
        </div>
      </div>

      <EmptyState v-if="!loading && !homestays.length" text="没有符合条件的民宿" />
      <div v-else class="stay-list">
        <HomestayCard
          v-for="(h, i) in homestays.filter((x) => styleTag === '全部' || x.tags.includes(styleTag))"
          :key="h.id"
          :item="h"
          class="rise"
          :style="{ animationDelay: `${Math.min(i, 6) * 60}ms` }"
        />
      </div>

      <p class="tip">
        <b>取消政策</b>：入住前 3 天可免费取消；1-3 天收取 30%；当天及之后不可退。预订需预付全额房费，入住需登记身份证。
      </p>
    </div>
  </div>
</template>

<style scoped>
.page-hero {
  position: relative;
  padding-bottom: 0;
  background: var(--indigo-night);
}

.page-hero > img {
  width: 100%;
  height: 300px;
  object-fit: cover;
  opacity: 0.85;
}

.ph-text {
  position: absolute;
  top: 52px;
  left: 50%;
  transform: translateX(-50%);
  width: min(var(--container), calc(100% - 40px));
  color: var(--silver-light);
}

.ph-text em {
  font-style: normal;
  font-size: 11px;
  letter-spacing: 0.5em;
  color: var(--amber);
}

.ph-text h1 {
  margin-top: 8px;
  font-size: clamp(24px, 3.4vw, 36px);
  color: #fff;
}

.search-bar {
  position: relative;
  margin-top: -34px;
  display: flex;
  align-items: flex-end;
  gap: 14px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-2);
  padding: 16px 20px;
  z-index: 10;
}

.sb-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.sb-item label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: var(--text-3);
  letter-spacing: 0.1em;
}

.sb-item input,
.sb-item select {
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  padding: 8px 10px;
  font-size: 13.5px;
  background: var(--paper);
}

.nights {
  font-size: 13px;
  color: var(--primary);
  font-weight: 600;
  padding-bottom: 9px;
}

.search-bar .btn {
  margin-left: auto;
}

.filter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 26px 0 20px;
}

.fr-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.fr-group > span {
  font-size: 12.5px;
  color: var(--text-3);
  letter-spacing: 0.2em;
}

.fr-group button {
  padding: 5px 15px;
  font-size: 13px;
  border-radius: 999px;
  border: 1px solid var(--line-strong);
  color: var(--text-2);
  background: #fff;
  transition: all 0.2s;
}

.fr-group button.on {
  background: var(--indigo);
  border-color: var(--indigo);
  color: var(--silver-light);
  font-weight: 600;
}

.fr-group select {
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  padding: 6px 10px;
  font-size: 13px;
  background: #fff;
}

.stay-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.tip {
  margin-top: 32px;
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

@media (max-width: 1023px) {
  .stay-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 899px) {
  .search-bar {
    flex-wrap: wrap;
  }

  .search-bar .btn {
    margin-left: 0;
    width: 100%;
  }
}

@media (max-width: 599px) {
  .stay-list {
    grid-template-columns: 1fr;
  }
}
</style>
