<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as api from '@/api'
import { unwrapError } from '@/api'
import type { Product } from '@/types'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'
import { useFavoriteStore } from '@/stores/favorite'
import QtyStepper from '@/components/QtyStepper.vue'
import EmptyState from '@/components/EmptyState.vue'
import AppIcon from '@/components/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()
const favStore = useFavoriteStore()

const product = ref<Product | null>(null)
const notFound = ref(false)
const curImg = ref(0)
const skuId = ref('')
const qty = ref(1)
const tab = ref<'craft' | 'detail' | 'reviews'>('detail')
const favorited = ref(false)
const buying = ref(false)

const curSku = computed(() => product.value?.skus.find((s) => s.id === skuId.value) || product.value?.skus[0])
const curPrice = computed(() => curSku.value?.price ?? product.value?.price ?? 0)
const isSpecialty = computed(() => product.value?.module === 'SPECIALTY')

async function load() {
  notFound.value = false
  product.value = null
  const id = route.params.id as string
  try {
    const res = await api.getProductDetail(id)
    product.value = res.data
    skuId.value = res.data.skus[0]?.id || ''
    qty.value = 1
    curImg.value = 0
    favorited.value = api.isFavorite(id)
    tab.value = res.data.craft ? 'craft' : 'detail'
  } catch {
    notFound.value = true
  }
}

onMounted(load)
watch(() => route.params.id, load)

async function toggleFav() {
  favorited.value = await favStore.toggle(product.value!.id)
  userStore.toast(favorited.value ? '已加入收藏' : '已取消收藏')
}

async function addToCart() {
  if (!userStore.requireLogin()) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  try {
    await cartStore.add({
      productId: product.value!.id,
      skuId: skuId.value || undefined,
      title: product.value!.title,
      cover: product.value!.cover,
      sku: curSku.value?.name || '默认规格',
      price: curPrice.value,
      qty: qty.value,
      stock: curSku.value?.stock ?? product.value!.stock,
      shop: isSpecialty.value ? '乌东特产合作社' : '乌东非遗工坊',
    })
    userStore.toast('已加入购物车')
  } catch (e) {
    userStore.toast(unwrapError(e).message)
  }
}

async function buyNow() {
  if (!userStore.requireLogin()) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  buying.value = true
  try {
    await addToCart()
    router.push('/cart')
  } finally {
    buying.value = false
  }
}
</script>

<template>
  <div class="pd-page container">
    <EmptyState v-if="notFound" text="商品不存在或已下架">
      <router-link to="/goods" class="btn btn-outline">回到衣馆</router-link>
    </EmptyState>

    <template v-else-if="product">
      <nav class="crumbs">
        <router-link to="/">首页</router-link>
        <span>/</span>
        <router-link :to="isSpecialty ? '/food?tab=specialty' : '/goods'">
          {{ isSpecialty ? '苗家特产' : '非遗好物' }}
        </router-link>
        <span>/</span>
        <b>{{ product.title }}</b>
      </nav>

      <div class="pd-main">
        <div class="gallery">
          <div class="main-img">
            <img :src="product.images[curImg]" :alt="product.title" />
          </div>
          <div v-if="product.images.length > 1" class="thumbs">
            <button
              v-for="(im, i) in product.images"
              :key="i"
              :class="{ on: i === curImg }"
              @mouseenter="curImg = i"
              @click="curImg = i"
            >
              <img :src="im" :alt="`预览 ${i + 1}`" />
            </button>
          </div>
        </div>

        <div class="info">
          <span class="cat">{{ product.category }} · {{ isSpecialty ? '产地直发' : '非遗手作' }}</span>
          <h1>{{ product.title }}</h1>
          <p class="subtitle">{{ product.subtitle }}</p>

          <div class="price-panel">
            <span class="price">{{ curPrice }}</span>
            <span v-if="product.marketPrice" class="market">市场价 ¥{{ product.marketPrice }}</span>
            <span class="sales">已售 {{ product.sales }}</span>
            <span class="stock" :class="{ low: (curSku?.stock ?? product.stock) <= 5 }">
              {{ (curSku?.stock ?? product.stock) <= 5 ? `仅剩 ${curSku?.stock ?? product.stock} 件` : '有货' }}
            </span>
          </div>

          <div v-if="product.skus.length > 1" class="sku-block">
            <h5>选择规格</h5>
            <div class="skus">
              <button
                v-for="s in product.skus"
                :key="s.id"
                :class="{ on: s.id === skuId, off: s.stock === 0 }"
                :disabled="s.stock === 0"
                @click="skuId = s.id"
              >
                {{ s.name }}
              </button>
            </div>
          </div>

          <div class="qty-block">
            <h5>数量</h5>
            <QtyStepper v-model="qty" :max="curSku?.stock ?? product.stock" />
          </div>

          <div class="actions">
            <button class="btn btn-outline btn-lg" @click="addToCart">加入购物车</button>
            <button class="btn btn-primary btn-lg" :disabled="buying" @click="buyNow">立即购买</button>
            <button class="fav" :class="{ on: favorited }" @click="toggleFav">
              <AppIcon name="heart" :size="17" />
              {{ favorited ? '已收藏' : '收藏' }}
            </button>
          </div>

          <ul class="promise">
            <li><AppIcon name="check" :size="13" /> 顺丰包邮</li>
            <li><AppIcon name="check" :size="13" /> 7 天无理由（定制除外）</li>
            <li v-if="product.origin"><AppIcon name="location" :size="13" /> 溯源：{{ product.origin }}</li>
            <li v-if="product.shelfLife"><AppIcon name="clock" :size="13" /> 保质期：{{ product.shelfLife }}</li>
          </ul>
        </div>
      </div>

      <!-- 传承人 -->
      <section v-if="product.artisan" class="artisan">
        <div class="a-img">
          <img :src="product.artisan.avatar" :alt="product.artisan.name" />
        </div>
        <div class="a-body">
          <em>ARTISAN · 传承人</em>
          <h3>{{ product.artisan.name }} <span>{{ product.artisan.title }}</span></h3>
          <p>{{ product.artisan.story }}</p>
        </div>
        <div class="a-craft">
          <em>工艺 · CRAFT</em>
          <p>{{ product.craft }}</p>
        </div>
      </section>

      <!-- 详情与评价 -->
      <section class="pd-tabs">
        <div class="tab-bar">
          <button v-if="product.craft" :class="{ on: tab === 'craft' }" @click="tab = 'craft'">工艺故事</button>
          <button :class="{ on: tab === 'detail' }" @click="tab = 'detail'">图文详情</button>
          <button :class="{ on: tab === 'reviews' }" @click="tab = 'reviews'">
            评价 ({{ product.reviews.length }})
          </button>
        </div>

        <div class="tab-body">
          <div v-if="tab === 'craft'" class="craft-body">
            <p class="craft-text">{{ product.craft }}</p>
            <img v-if="product.artisan" :src="product.images[product.images.length - 1]" alt="工艺细节" />
          </div>

          <div v-else-if="tab === 'detail'" class="detail-body" v-html="product.detail"></div>

          <div v-else class="reviews">
            <EmptyState v-if="!product.reviews.length" text="还没有评价，期待你成为第一位" />
            <div v-for="r in product.reviews" :key="r.id" class="review">
              <img class="r-avatar" :src="r.avatar" :alt="r.user" />
              <div class="r-body">
                <div class="r-head">
                  <b>{{ r.user }}</b>
                  <span class="r-stars">
                    <i v-for="n in 5" :key="n" :class="{ fill: n <= r.rating }">★</i>
                  </span>
                  <time>{{ r.date }}</time>
                </div>
                <p>{{ r.content }}</p>
                <div v-if="r.reply" class="r-reply">
                  <b>商家回复</b>{{ r.reply }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>

    <div v-else class="loading-block">
      <div class="sk" style="height: 420px"></div>
      <div class="sk" style="height: 420px"></div>
    </div>
  </div>
</template>

<style scoped>
.pd-page {
  padding-top: 26px;
}

.crumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--text-3);
  margin-bottom: 22px;
}

.crumbs a:hover {
  color: var(--primary);
}

.crumbs b {
  color: var(--text-2);
  font-weight: 500;
}

.pd-main {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 4fr);
  gap: 40px;
  align-items: start;
}

.gallery {
  position: sticky;
  top: 84px;
}

.main-img {
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--line);
  background: var(--indigo-mist);
}

.main-img img {
  width: 100%;
  aspect-ratio: 1/0.92;
  object-fit: cover;
}

.thumbs {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.thumbs button {
  width: 74px;
  border-radius: var(--radius);
  overflow: hidden;
  border: 2px solid transparent;
  opacity: 0.7;
  transition: all 0.2s;
}

.thumbs button.on {
  border-color: var(--accent);
  opacity: 1;
}

.info .cat {
  font-size: 12px;
  letter-spacing: 0.2em;
  color: var(--primary);
}

.info h1 {
  font-family: var(--font-display);
  font-size: 26px;
  color: var(--ink);
  margin-top: 8px;
  line-height: 1.4;
}

.subtitle {
  margin-top: 6px;
  color: var(--text-2);
  font-size: 14px;
  letter-spacing: 0.05em;
}

.price-panel {
  display: flex;
  align-items: baseline;
  gap: 14px;
  background: linear-gradient(90deg, rgba(181, 68, 46, 0.07), transparent);
  border: 1px solid rgba(181, 68, 46, 0.18);
  border-radius: var(--radius);
  padding: 14px 18px;
  margin: 18px 0;
}

.price {
  font-size: 30px;
}

.market {
  font-size: 12.5px;
  color: var(--text-3);
  text-decoration: line-through;
}

.sales {
  margin-left: auto;
  font-size: 12.5px;
  color: var(--text-3);
}

.stock {
  font-size: 12.5px;
  color: #3d6b4f;
}

.stock.low {
  color: var(--accent);
  font-weight: 700;
}

.sku-block h5,
.qty-block h5 {
  font-size: 12px;
  color: var(--text-3);
  letter-spacing: 0.25em;
  margin-bottom: 10px;
  font-weight: 500;
}

.skus {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
}

.skus button {
  padding: 8px 18px;
  border: 1.5px solid var(--line-strong);
  border-radius: var(--radius);
  font-size: 13px;
  color: var(--text-2);
  transition: all 0.2s;
  background: #fff;
}

.skus button.on {
  border-color: var(--accent);
  color: var(--accent);
  font-weight: 700;
  background: rgba(181, 68, 46, 0.05);
}

.skus button.off {
  opacity: 0.4;
  text-decoration: line-through;
  cursor: not-allowed;
}

.qty-block {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 22px;
}

.qty-block h5 {
  margin-bottom: 0;
}

.actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.actions .btn {
  flex: 1;
}

.fav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--text-3);
  padding: 6px 10px;
  transition: color 0.2s;
}

.fav.on {
  color: var(--accent);
}

.promise {
  margin-top: 22px;
  padding-top: 16px;
  border-top: 1px dashed var(--line);
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
}

.promise li {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--text-2);
}

.promise :deep(svg) {
  color: var(--amber);
}

/* 传承人 */
.artisan {
  display: grid;
  grid-template-columns: 110px 1.4fr 1fr;
  gap: 24px;
  background: var(--indigo-deep);
  color: var(--silver-light);
  border-radius: var(--radius-lg);
  padding: 28px 30px;
  margin-top: 44px;
  align-items: start;
}

.artisan em {
  font-style: normal;
  font-size: 10px;
  letter-spacing: 0.4em;
  color: var(--amber);
}

.a-img img {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(215, 224, 230, 0.35);
  margin-top: 6px;
}

.a-body h3 {
  font-family: var(--font-display);
  font-size: 19px;
  margin: 6px 0 10px;
}

.a-body h3 span {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 400;
  color: var(--amber);
  margin-left: 10px;
  letter-spacing: 0.1em;
}

.a-body p,
.a-craft p {
  font-size: 13px;
  line-height: 2;
  color: rgba(215, 224, 230, 0.78);
}

.a-craft {
  border-left: 1px solid rgba(215, 224, 230, 0.18);
  padding-left: 24px;
}

@media (max-width: 1023px) {
  .artisan {
    grid-template-columns: 1fr;
  }

  .a-craft {
    border-left: none;
    padding-left: 0;
    border-top: 1px solid rgba(215, 224, 230, 0.18);
    padding-top: 18px;
  }
}

/* Tabs */
.pd-tabs {
  margin-top: 40px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: #fff;
}

.tab-bar {
  display: flex;
  border-bottom: 1px solid var(--line);
  background: var(--paper);
}

.tab-bar button {
  padding: 14px 30px;
  font-size: 14.5px;
  letter-spacing: 0.1em;
  color: var(--text-2);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.2s;
}

.tab-bar button.on {
  color: var(--accent);
  font-weight: 700;
  border-bottom-color: var(--accent);
  background: #fff;
}

.tab-body {
  padding: 30px 34px;
  min-height: 200px;
}

.craft-text {
  font-size: 14.5px;
  line-height: 2.2;
  color: var(--text);
  max-width: 760px;
  margin-bottom: 20px;
}

.craft-body img {
  border-radius: var(--radius);
  max-height: 420px;
  object-fit: cover;
}

.detail-body {
  font-size: 14.5px;
  line-height: 2.1;
  color: var(--text);
  max-width: 760px;
}

.detail-body :deep(p) {
  margin-bottom: 12px;
}

.reviews {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.review {
  display: flex;
  gap: 14px;
  padding-bottom: 20px;
  border-bottom: 1px dashed var(--line);
}

.r-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex: none;
}

.r-body {
  flex: 1;
}

.r-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.r-head b {
  font-size: 14px;
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

.r-body p {
  margin-top: 7px;
  font-size: 14px;
  color: var(--text);
  line-height: 1.9;
}

.r-reply {
  margin-top: 10px;
  background: var(--paper);
  border-left: 2px solid var(--indigo);
  padding: 9px 13px;
  font-size: 12.5px;
  color: var(--text-2);
  border-radius: 0 var(--radius) var(--radius) 0;
}

.r-reply b {
  color: var(--primary);
  margin-right: 10px;
  font-weight: 600;
}

.loading-block {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.sk {
  border-radius: var(--radius-lg);
  background: linear-gradient(100deg, var(--paper-2) 40%, #f7f4ee 50%, var(--paper-2) 60%);
  background-size: 200% 100%;
  animation: pd-shine 1.4s infinite;
}

@keyframes pd-shine {
  to {
    background-position: -200% 0;
  }
}

@media (max-width: 1023px) {
  .pd-main {
    grid-template-columns: 1fr;
  }

  .gallery {
    position: static;
  }
}
</style>
