<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as api from '@/api'
import type { CultureSection, Product } from '@/types'
import ProductCard from '@/components/ProductCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import CultureBand from '@/components/CultureBand.vue'
import { img } from '@/mock/images'

/** 文化导览推文：后端接口异步加载，先讲手艺再挑东西 */
const culture = ref<CultureSection | null>(null)
onMounted(async () => {
  culture.value = (await api.getCultureSection('YI')) ?? null
})

const sorts = [
  { key: 'default', label: '综合' },
  { key: 'sales', label: '销量' },
  { key: 'price-asc', label: '价格 ↑' },
  { key: 'price-desc', label: '价格 ↓' },
  { key: 'rating', label: '评分' },
] as const

/** 类目来自后端，筛选按 id 传参；null 表示「全部」 */
const cats = ref<api.Category[]>([])
const catId = ref<string | null>(null)
const sort = ref<(typeof sorts)[number]['key']>('default')
const maxPrice = ref<number | null>(null)
const items = ref<Product[]>([])
const total = ref(0)
const loading = ref(true)

const heroImg = img('Miao embroidery and silver jewelry flat lay on indigo cloth, wide banner', 'landscape_16_9')

async function load() {
  loading.value = true
  const res = await api.getGoodsList({
    module: 'GOODS',
    category_id: catId.value ?? undefined,
    sort: sort.value,
    max_price: maxPrice.value ?? undefined,
    // 本页无分页控件，一次取全量（后端上限 100）
    page_size: 100,
  })
  items.value = res.data.items
  total.value = res.data.total
  loading.value = false
}

onMounted(async () => {
  cats.value = (await api.getCategories('GOODS')).data
  await load()
})
</script>

<template>
  <div class="goods-page">
    <div class="page-hero">
      <img :src="heroImg" alt="" />
      <div class="ph-text container">
        <em>衣 · INTANGIBLE HERITAGE</em>
        <h1 class="h-display">把苗岭的手艺带回家</h1>
        <p>每一件都出自乌东村匠人之手，附传承人证书</p>
      </div>
    </div>

    <!-- 放在 .container 之外：组件自带 container，避免双层收窄 -->
    <CultureBand v-if="culture" :section="culture" />

    <div class="container layout">
      <aside class="filters">
        <div class="f-block">
          <h4>分类</h4>
          <button
            class="f-cat"
            :class="{ on: catId === null }"
            @click="catId = null; load()"
          >
            全部
          </button>
          <button
            v-for="c in cats"
            :key="c.id"
            class="f-cat"
            :class="{ on: catId === c.id }"
            @click="catId = c.id; load()"
          >
            {{ c.name }}
          </button>
        </div>
        <div class="f-block">
          <h4>价格上限</h4>
          <div class="f-price">
            <input v-model.number="maxPrice" type="number" min="0" placeholder="不限" @keyup.enter="load" />
            <button class="btn btn-ghost" @click="load">确定</button>
          </div>
          <div class="quick">
            <button @click="maxPrice = 100; load()">≤100</button>
            <button @click="maxPrice = 500; load()">≤500</button>
            <button @click="maxPrice = null; load()">全部</button>
          </div>
        </div>
        <div class="f-note">
          <h4>匠人承诺</h4>
          <p>· 纯手工制作，一物一纹样</p>
          <p>· 7 天无理由退换（定制除外）</p>
          <p>· 顺丰包邮 · 传承人亲签证书</p>
        </div>
      </aside>

      <main>
        <div class="toolbar">
          <span class="count">共 {{ total }} 件作品</span>
          <div class="sorts">
            <button
              v-for="s in sorts"
              :key="s.key"
              :class="{ on: sort === s.key }"
              @click="sort = s.key; load()"
            >
              {{ s.label }}
            </button>
          </div>
        </div>

        <div v-if="loading" class="grid"><div class="skeleton" v-for="i in 8" :key="i"></div></div>
        <EmptyState v-else-if="!items.length" text="没有符合条件的作品，换个筛选试试" />
        <div v-else class="grid card-grid">
          <ProductCard v-for="(g, i) in items" :key="g.id" :item="g" class="rise" :style="{ animationDelay: `${Math.min(i, 8) * 50}ms` }" />
        </div>
      </main>
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
  opacity: 0.86;
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

.layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 30px;
  padding-top: 32px;
}

.filters {
  position: sticky;
  top: 84px;
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: 26px;
}

.f-block h4 {
  font-size: 13px;
  letter-spacing: 0.25em;
  color: var(--text-3);
  margin-bottom: 12px;
  font-weight: 500;
}

.f-cat {
  display: block;
  width: 100%;
  text-align: left;
  padding: 9px 14px;
  font-size: 14px;
  color: var(--text-2);
  border-radius: var(--radius);
  border-left: 2px solid transparent;
  transition: all 0.2s;
  letter-spacing: 0.1em;
}

.f-cat:hover {
  color: var(--primary);
  background: rgba(35, 69, 107, 0.06);
}

.f-cat.on {
  color: var(--primary);
  font-weight: 700;
  background: rgba(35, 69, 107, 0.09);
  border-left-color: var(--accent);
}

.f-price {
  display: flex;
  gap: 8px;
}

.f-price input {
  width: 90px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  padding: 7px 10px;
  font-size: 13px;
}

.f-price .btn {
  padding: 6px 14px;
  font-size: 12px;
}

.quick {
  display: flex;
  gap: 6px;
  margin-top: 10px;
}

.quick button {
  font-size: 12px;
  color: var(--text-2);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 2px 11px;
  transition: all 0.2s;
}

.quick button:hover {
  color: var(--primary);
  border-color: var(--primary);
}

.f-note {
  background: var(--indigo-mist);
  border-radius: var(--radius-lg);
  padding: 16px;
}

.f-note h4 {
  margin-bottom: 8px;
  color: var(--primary);
}

.f-note p {
  font-size: 12px;
  color: var(--text-2);
  line-height: 2;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
}

.count {
  font-size: 13px;
  color: var(--text-3);
}

.sorts {
  display: flex;
  gap: 4px;
}

.sorts button {
  font-size: 13px;
  padding: 5px 13px;
  border-radius: var(--radius);
  color: var(--text-2);
  transition: all 0.2s;
}

.sorts button:hover {
  color: var(--primary);
}

.sorts button.on {
  background: var(--indigo);
  color: var(--silver-light);
  font-weight: 600;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.skeleton {
  aspect-ratio: 1/1.24;
  border-radius: var(--radius-lg);
  background: linear-gradient(100deg, var(--paper-2) 40%, #f7f4ee 50%, var(--paper-2) 60%);
  background-size: 200% 100%;
  animation: shine 1.4s infinite;
}

@keyframes shine {
  to {
    background-position: -200% 0;
  }
}

@media (max-width: 1023px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 899px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .filters {
    position: static;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 18px;
  }

  .f-block h4 {
    margin-bottom: 6px;
  }
}

@media (max-width: 599px) {
  .grid { grid-template-columns: 1fr; }
}
</style>
