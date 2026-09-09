<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as api from '@/api'
import type { Homestay } from '@/types'
import HomestayCard from '@/components/HomestayCard.vue'
import AppIcon from '@/components/AppIcon.vue'

const homestays = ref<Homestay[]>([])
const loading = ref(true)

const styleTags = ['全部', '吊脚楼', '设计感', '亲子友好', '观云海']
const styleTag = ref('全部')

onMounted(async () => {
  const res = await api.getHomestays()
  homestays.value = res.data
  loading.value = false
})
</script>

<template>
  <div class="stay-page">
    <div class="page-hero">
      <div class="ph-text container">
        <em>住 · MOUNTAIN LODGE</em>
        <h1 class="h-display">推开窗，就是云海与梯田</h1>
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
      </div>

      <div v-if="!loading && !homestays.length" class="empty-state">没有符合条件的民宿</div>
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
  padding: 40px 0 30px;
  background: var(--indigo-night);
}

.ph-text {
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

.filter-row {
  display: flex;
  align-items: center;
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

.stay-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: var(--text-3);
  font-size: 14px;
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

@media (max-width: 599px) {
  .stay-list {
    grid-template-columns: 1fr;
  }
}
</style>
