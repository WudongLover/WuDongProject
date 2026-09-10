<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as api from '@/api'
import type { Homestay, Post, Product, Restaurant, TravelRoute } from '@/types'
import ProductCard from '@/components/ProductCard.vue'
import RestaurantCard from '@/components/RestaurantCard.vue'
import HomestayCard from '@/components/HomestayCard.vue'
import RouteCard from '@/components/RouteCard.vue'
import PostCard from '@/components/PostCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import SectionTitle from '@/components/SectionTitle.vue'

const route = useRoute()
const router = useRouter()

const kw = ref((route.query.kw as string) || '')
const results = ref<{
  goods: Product[]
  restaurants: Restaurant[]
  homestays: Homestay[]
  routes: TravelRoute[]
  posts: Post[]
} | null>(null)
const loading = ref(false)
const hot = ['银饰', '长桌宴', '云海民宿', '苗年节', '蓝染体验', '酸汤鱼']

async function search() {
  const keyword = kw.value.trim()
  if (!keyword) return
  loading.value = true
  // 商品走真实后端，其余板块仍为 mock（两者 id 体系不同，不能混用 searchAll.goods）
  const [all, goodsRes] = await Promise.all([
    api.searchAll(keyword),
    api.getGoodsList({ keyword, page_size: 100 }),
  ])
  results.value = { ...all.data, goods: goodsRes.data.items }
  loading.value = false
  if (route.query.kw !== keyword) router.replace({ query: { kw: keyword } })
}

onMounted(search)

watch(
  () => route.query.kw,
  (v) => {
    if (v && v !== kw.value) {
      kw.value = v as string
      search()
    }
  },
)

const hasResult = () => results.value && Object.values(results.value).some((a) => a.length)
</script>

<template>
  <div class="search-page container">
    <div class="s-head">
      <h1 class="h-display">搜索「{{ kw }}」</h1>
      <div class="hot-row">
        <span>大家都在搜：</span>
        <button v-for="k in hot" :key="k" @click="kw = k; search()">{{ k }}</button>
      </div>
    </div>

    <div v-if="loading" class="loading">搜索中…</div>

    <template v-else>
      <EmptyState v-if="!hasResult()" text="没有找到相关内容，换个词试试">
        <router-link to="/" class="btn btn-outline">回首页逛逛</router-link>
      </EmptyState>

      <template v-else>
        <section v-if="results!.goods.length" class="sec">
          <SectionTitle title="商品与特产" :more="undefined" />
          <div class="grid">
            <ProductCard v-for="g in results!.goods" :key="g.id" :item="g" />
          </div>
        </section>

        <section v-if="results!.restaurants.length" class="sec">
          <SectionTitle title="餐厅" />
          <div class="grid-2">
            <RestaurantCard v-for="r in results!.restaurants" :key="r.id" :item="r" />
          </div>
        </section>

        <section v-if="results!.homestays.length" class="sec">
          <SectionTitle title="民宿" />
          <div class="grid-2">
            <HomestayCard v-for="h in results!.homestays" :key="h.id" :item="h" />
          </div>
        </section>

        <section v-if="results!.routes.length" class="sec">
          <SectionTitle title="路线" />
          <div class="grid-2">
            <RouteCard v-for="r in results!.routes" :key="r.id" :item="r" />
          </div>
        </section>

        <section v-if="results!.posts.length" class="sec">
          <SectionTitle title="游记" />
          <div class="waterfall">
            <PostCard v-for="p in results!.posts" :key="p.id" :item="p" />
          </div>
        </section>
      </template>
    </template>
  </div>
</template>

<style scoped>
.search-page {
  padding-top: 40px;
  min-height: 50vh;
}

.s-head h1 {
  font-size: clamp(22px, 3vw, 30px);
}

.hot-row {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
  margin-top: 14px;
  font-size: 12.5px;
  color: var(--text-3);
}

.hot-row button {
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 3px 13px;
  font-size: 12.5px;
  color: var(--text-2);
  transition: all 0.2s;
  background: #fff;
}

.hot-row button:hover {
  color: var(--accent);
  border-color: rgba(181, 68, 46, 0.4);
}

.loading {
  text-align: center;
  padding: 80px 0;
  color: var(--text-3);
  letter-spacing: 0.3em;
}

.sec {
  margin-top: 40px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

.waterfall {
  columns: 3 240px;
  column-gap: 16px;
}

@media (max-width: 1023px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 599px) {
  .grid, .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
