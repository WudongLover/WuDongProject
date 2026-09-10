<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getRestaurants, getSpecialties } from '@/api/food'
import * as api from '@/api'
import type { Product, Restaurant } from '@/types'
import RestaurantCard from '@/components/RestaurantCard.vue'
import ProductCard from '@/components/ProductCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import CultureBand from '@/components/CultureBand.vue'
import { img } from '@/mock/images'

/** 文化导览：长桌宴、火塘、酸汤的来路跨「宴 / 产」两个 tab，故放在 tab 之上做全局导览 */
const culture = api.getCultureSection('SHI')

const route = useRoute()
const tab = ref<'restaurant' | 'specialty'>((route.query.tab as 'specialty') === 'specialty' ? 'specialty' : 'restaurant')

const restaurants = ref<Restaurant[]>([])
const specialties = ref<Product[]>([])
const loading = ref(true)

const heroImg = img('Miao long table banquet dishes overhead view, vibrant food photography, wide banner', 'landscape_16_9')

onMounted(async () => {
  // 两个 tab 各自独立取数：任一接口失败只影响自己那一栏，不能让整页卡在 loading
  const [r, s] = await Promise.allSettled([getRestaurants(), getSpecialties()])
  if (r.status === 'fulfilled') restaurants.value = r.value.data
  if (s.status === 'fulfilled') specialties.value = s.value.data.items
  loading.value = false
})

const spCats = ['全部', '茶叶', '腊肉', '米酒', '酸食', '其他']
const spCat = ref('全部')
</script>

<template>
  <div class="food-page">
    <div class="page-hero">
      <img :src="heroImg" alt="" />
      <div class="ph-text container">
        <em>食 · TASTE OF MIAO</em>
        <h1 class="h-display">一碗酸汤，半座苗寨</h1>
        <p>长桌宴预订 · 高山特产直发</p>
      </div>
    </div>

    <!-- 先读特色，再选「宴」或「产」 -->
    <CultureBand v-if="culture" :section="culture" />

    <div class="container">
      <div class="big-tabs">
        <button :class="{ on: tab === 'restaurant' }" @click="tab = 'restaurant'">
          <i>宴</i> 餐厅预订
        </button>
        <button :class="{ on: tab === 'specialty' }" @click="tab = 'specialty'">
          <i>产</i> 高山特产
        </button>
      </div>

      <!-- 餐厅 -->
      <section v-if="tab === 'restaurant'">
        <EmptyState v-if="!loading && !restaurants.length" text="暂无餐厅" />
        <div v-else class="rest-list card-grid">
          <RestaurantCard v-for="(r, i) in restaurants" :key="r.id" :item="r" class="rise" :style="{ animationDelay: `${Math.min(i, 6) * 60}ms` }" />
        </div>
        <p class="tip">
          <b>预订须知</b>：餐位需提前 2 小时预订；用餐前 24 小时可免费取消，24 小时内取消扣 50%。
        </p>
      </section>

      <!-- 特产 -->
      <section v-else>
        <div class="sp-cats">
          <button
            v-for="c in spCats"
            :key="c"
            :class="{ on: spCat === c }"
            @click="spCat = c"
          >
            {{ c }}
          </button>
        </div>
        <EmptyState v-if="!loading && !specialties.filter((s) => spCat === '全部' || s.category === spCat).length" text="该分类暂无特产" />
        <div v-else class="sp-grid card-grid">
          <ProductCard
            v-for="(s, i) in specialties.filter((x) => spCat === '全部' || x.category === spCat)"
            :key="s.id"
            :item="s"
            class="rise"
            :style="{ animationDelay: `${Math.min(i, 8) * 50}ms` }"
          />
        </div>
        <p class="tip">
          <b>发货说明</b>：特产与非遗商品共用购物车与结算；生鲜类（腊肉/糍粑）默认冷链或真空发货。
        </p>
      </section>
    </div>
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

.big-tabs {
  display: flex;
  gap: 14px;
  padding: 28px 0 22px;
}

.big-tabs button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 17px;
  font-size: 17px;
  letter-spacing: 0.2em;
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--text-2);
  background: #fff;
  border: 1.5px solid var(--line);
  border-radius: var(--radius-lg);
  transition: all 0.25s var(--ease);
}

.big-tabs button i {
  font-style: normal;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  font-size: 19px;
  background: var(--indigo-mist);
  color: var(--primary);
  border-radius: 6px;
  transition: all 0.25s;
}

.big-tabs button.on {
  color: var(--accent);
  border-color: rgba(181, 68, 46, 0.5);
  background: rgba(181, 68, 46, 0.04);
}

.big-tabs button.on i {
  background: var(--accent);
  color: #fff;
}

.rest-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

.sp-cats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.sp-cats button {
  padding: 7px 20px;
  border-radius: 999px;
  border: 1px solid var(--line-strong);
  font-size: 13.5px;
  letter-spacing: 0.1em;
  color: var(--text-2);
  background: #fff;
  transition: all 0.2s;
}

.sp-cats button.on {
  background: var(--indigo);
  color: var(--silver-light);
  border-color: var(--indigo);
  font-weight: 600;
}

.sp-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}

.tip {
  margin-top: 30px;
  padding: 13px 18px;
  background: var(--indigo-mist);
  border-radius: var(--radius);
  font-size: 12.5px;
  color: var(--text-2);
  letter-spacing: 0.03em;
}

.tip b {
  color: var(--primary);
  margin-right: 10px;
}

@media (max-width: 1023px) {
  .rest-list, .sp-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 599px) {
  .rest-list, .sp-grid {
    grid-template-columns: 1fr;
  }
}
</style>
