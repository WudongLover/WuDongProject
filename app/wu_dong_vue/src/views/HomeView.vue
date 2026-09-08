<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as api from '@/api'
import type { Banner, Homestay, Post, Product, Restaurant, TravelRoute } from '@/types'
import SectionTitle from '@/components/SectionTitle.vue'
import ProductCard from '@/components/ProductCard.vue'
import RestaurantCard from '@/components/RestaurantCard.vue'
import HomestayCard from '@/components/HomestayCard.vue'
import RouteCard from '@/components/RouteCard.vue'
import PostCard from '@/components/PostCard.vue'
import AppIcon from '@/components/AppIcon.vue'
import { scene } from '@/mock/images'

const banners = ref<Banner[]>([])
const announcements = ref<string[]>([])
const goods = ref<Product[]>([])
const restaurants = ref<Restaurant[]>([])
const homestays = ref<Homestay[]>([])
const routesList = ref<TravelRoute[]>([])
const posts = ref<Post[]>([])
const hotKeywords = ref<string[]>([])

const cur = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

function go(i: number) {
  cur.value = (i + banners.value.length) % banners.value.length
}

onMounted(async () => {
  const res = await api.getHomeData()
  banners.value = res.data.banners
  announcements.value = res.data.announcements
  goods.value = res.data.recommends.goods
  restaurants.value = res.data.recommends.restaurants
  homestays.value = res.data.recommends.homestays
  routesList.value = res.data.recommends.routes
  posts.value = res.data.recommends.posts
  hotKeywords.value = res.data.hotKeywords
  timer = setInterval(() => go(cur.value + 1), 5200)
})

onUnmounted(() => clearInterval(timer))

const modules = [
  { to: '/goods', glyph: '衣', name: '非遗好物', desc: '银饰 · 蜡染 · 刺绣', cls: 'c1' },
  { to: '/food', glyph: '食', name: '苗家风味', desc: '长桌宴 · 高山特产', cls: 'c2' },
  { to: '/stay', glyph: '住', name: '山居民宿', desc: '吊脚楼 · 观云海', cls: 'c3' },
  { to: '/trip', glyph: '行', name: '门票路线', desc: '一日游 · 苗年节庆', cls: 'c4' },
  { to: '/community', glyph: '记', name: '社区', desc: '游记 · 攻略 · 相遇', cls: 'c5' },
]
</script>

<template>
  <div class="home">
    <!-- Banner 轮播 -->
    <section class="hero">
      <transition-group name="hero">
        <div v-for="(b, i) in banners" v-show="i === cur" :key="b.id" class="hero-slide">
          <img :src="b.image" :alt="b.title" />
          <div class="hero-mask"></div>
          <div class="hero-text container">
            <em class="eyebrow">{{ i === 0 ? 'WUDONG VILLAGE' : i === 1 ? 'STAY IN CLOUDS' : 'LONG TABLE FEAST' }}</em>
            <h1>{{ b.title }}</h1>
            <p>{{ b.subtitle }}</p>
            <router-link :to="b.link" class="btn btn-primary btn-lg hero-btn">立即探索</router-link>
          </div>
        </div>
      </transition-group>

      <div class="hero-dots">
        <button
          v-for="(b, i) in banners"
          :key="b.id"
          :class="{ on: i === cur }"
          :aria-label="`第 ${i + 1} 张`"
          @click="go(i)"
        ></button>
      </div>

      <div class="hero-side">
        <div class="side-card fade">
          <h4>云上乌东</h4>
          <p>海拔 1300m · 今日多云 22℃</p>
          <ul>
            <li><AppIcon name="fire" :size="14" /> 今日游客 862 人</li>
            <li><AppIcon name="star" :size="14" /> 苗年节倒计时 63 天</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- 公告横幅 -->
    <div class="notice container">
      <span class="n-tag"><AppIcon name="bell" :size="14" /> 公告</span>
      <div class="n-scroll">
        <transition-group name="roll">
          <span :key="cur % Math.max(announcements.length, 1)" class="n-text">
            {{ announcements[cur % Math.max(announcements.length, 1)] }}
          </span>
        </transition-group>
      </div>
      <div class="hot">
        <span>热搜：</span>
        <router-link v-for="k in hotKeywords.slice(0, 4)" :key="k" :to="`/search?kw=${k}`">{{ k }}</router-link>
      </div>
    </div>

    <!-- 金刚区 -->
    <section class="container kingkong">
      <router-link v-for="(m, i) in modules" :key="m.to" :to="m.to" class="kk-card rise" :style="{ animationDelay: `${i * 70}ms` }">
        <span class="kk-glyph" :class="m.cls">{{ m.glyph }}</span>
        <span class="kk-name">{{ m.name }}</span>
        <span class="kk-desc">{{ m.desc }}</span>
      </router-link>
    </section>

    <!-- 衣 -->
    <section class="container sec">
      <SectionTitle eyebrow="YI · INTANGIBLE HERITAGE" title="指尖上的苗艺" more="/goods" />
      <div class="grid-4">
        <ProductCard v-for="(g, i) in goods" :key="g.id" :item="g" class="rise" :style="{ animationDelay: `${i * 60}ms` }" />
      </div>
    </section>

    <!-- 食 -->
    <section class="sec-band">
      <div class="container sec">
        <SectionTitle eyebrow="SHI · TASTE OF MIAO" title="酸与火的席面" more="/food" />
        <div class="grid-3">
          <RestaurantCard v-for="(r, i) in restaurants" :key="r.id" :item="r" class="rise" :style="{ animationDelay: `${i * 70}ms` }" />
        </div>
      </div>
    </section>

    <!-- 住 -->
    <section class="container sec">
      <SectionTitle eyebrow="ZHU · MOUNTAIN LODGE" title="住进吊脚楼" more="/stay" />
      <div class="grid-3">
        <HomestayCard v-for="(h, i) in homestays" :key="h.id" :item="h" class="rise" :style="{ animationDelay: `${i * 70}ms` }" />
      </div>
    </section>

    <!-- 行 -->
    <section class="container sec">
      <SectionTitle eyebrow="XING · JOURNEY" title="山水与节庆" more="/trip" />
      <div class="grid-3">
        <RouteCard v-for="(r, i) in routesList" :key="r.id" :item="r" class="rise" :style="{ animationDelay: `${i * 70}ms` }" />
      </div>
    </section>

    <!-- 文化故事条 -->
    <section class="story-band">
      <div class="container story-inner">
        <img :src="scene('silversmith elder teaching apprentice in workshop, cinematic light', 'portrait_16_9')" alt="传承人" class="story-img" />
        <div class="story-text">
          <em>ARTISAN · 传承人故事</em>
          <h2 class="h-display">「银是有呼吸的」</h2>
          <p>
            杨光银，乌东村州级银饰锻造技艺传承人。十四岁随父学艺，守着老银铺的炉火四十余年。
            他坚持不用模具，每一件银器上的纹样都由手锤一寸寸敲出。到乌东，你可以坐进他的工坊，亲手敲一枚戒指。
          </p>
          <router-link to="/goods/g1" class="btn btn-outline story-btn">认识他的作品</router-link>
        </div>
      </div>
    </section>

    <!-- 社区 -->
    <section class="container sec">
      <SectionTitle eyebrow="SHEQU · COMMUNITY" title="他们正在记录乌东" more="/community" />
      <div class="waterfall">
        <PostCard v-for="p in posts" :key="p.id" :item="p" />
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ---------- Hero ---------- */
.hero {
  position: relative;
  height: min(64vh, 620px);
  min-height: 420px;
  overflow: hidden;
  background: var(--indigo-night);
}

.hero-slide {
  position: absolute;
  inset: 0;
}

.hero-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  animation: kenburns 9s var(--ease) both;
}

@keyframes kenburns {
  from {
    transform: scale(1.08);
  }
  to {
    transform: scale(1);
  }
}

.hero-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, rgba(15, 35, 56, 0.78) 8%, rgba(15, 35, 56, 0.32) 48%, rgba(15, 35, 56, 0.05) 78%);
}

.hero-text {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 50%;
  translate: 0 -50%;
  color: var(--silver-light);
  width: min(var(--container), calc(100% - 40px));
}

.eyebrow {
  display: block;
  font-style: normal;
  font-size: 12px;
  letter-spacing: 0.6em;
  color: var(--amber);
  margin-bottom: 14px;
  animation: rise 0.8s 0.1s var(--ease) both;
}

.hero-text h1 {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(34px, 6vw, 64px);
  letter-spacing: 0.1em;
  line-height: 1.15;
  text-shadow: 0 3px 24px rgba(0, 0, 0, 0.4);
  animation: rise 0.8s 0.22s var(--ease) both;
}

.hero-text p {
  margin-top: 12px;
  font-size: clamp(14px, 1.6vw, 17px);
  letter-spacing: 0.2em;
  color: rgba(215, 224, 230, 0.85);
  animation: rise 0.8s 0.34s var(--ease) both;
}

.hero-btn {
  margin-top: 30px;
  animation: rise 0.8s 0.46s var(--ease) both;
}

.hero-enter-active {
  transition: opacity 0.9s var(--ease);
}

.hero-leave-active {
  transition: opacity 0.7s var(--ease);
}

.hero-enter-from,
.hero-leave-to {
  opacity: 0;
}

.hero-dots {
  position: absolute;
  bottom: 22px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 9px;
  z-index: 5;
}

.hero-dots button {
  width: 26px;
  height: 3px;
  border-radius: 2px;
  background: rgba(215, 224, 230, 0.4);
  transition: all 0.3s;
}

.hero-dots button.on {
  background: var(--amber);
  width: 40px;
}

.hero-side {
  position: absolute;
  right: 40px;
  bottom: 46px;
  z-index: 5;
}

.side-card {
  background: rgba(246, 243, 236, 0.94);
  border-radius: var(--radius-lg);
  padding: 14px 18px;
  box-shadow: var(--shadow-2);
  border-left: 3px solid var(--amber);
  min-width: 210px;
}

.side-card h4 {
  font-family: var(--font-display);
  color: var(--indigo-deep);
  letter-spacing: 0.2em;
}

.side-card p {
  font-size: 12px;
  color: var(--text-3);
  margin: 3px 0 8px;
}

.side-card ul {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.side-card li {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-2);
}

.side-card li :deep(svg) {
  color: var(--accent);
}

/* ---------- 公告 ---------- */
.notice {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 11px 0;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
  overflow: hidden;
}

.n-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--accent);
  font-weight: 600;
  letter-spacing: 0.15em;
  flex: none;
}

.n-scroll {
  flex: 1;
  position: relative;
  height: 20px;
  overflow: hidden;
  min-width: 0;
}

.n-text {
  position: absolute;
  color: var(--text-2);
  white-space: nowrap;
}

.roll-enter-active,
.roll-leave-active {
  transition: all 0.5s var(--ease);
}

.roll-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

.roll-leave-to {
  opacity: 0;
  transform: translateY(-16px);
}

.hot {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-3);
  font-size: 12px;
  flex: none;
}

.hot a {
  color: var(--text-2);
  border: 1px solid var(--line);
  padding: 1px 9px;
  border-radius: 999px;
  transition: all 0.2s;
}

.hot a:hover {
  color: var(--accent);
  border-color: rgba(181, 68, 46, 0.4);
}

@media (max-width: 899px) {
  .hot {
    display: none;
  }

  .hero-side {
    display: none;
  }
}

/* ---------- 金刚区 ---------- */
.kingkong {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  padding: 30px 0 6px;
}

.kk-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 22px 10px 18px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  transition: all 0.3s var(--ease);
  position: relative;
  overflow: hidden;
}

.kk-card::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 3px;
  background: var(--indigo);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.35s var(--ease);
}

.kk-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-2);
}

.kk-card:hover::after {
  transform: scaleX(1);
}

.kk-glyph {
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 900;
  border-radius: 8px;
  margin-bottom: 4px;
}

.c1 { background: #e8eef5; color: var(--indigo); }
.c2 { background: #f7e9e4; color: var(--accent); }
.c3 { background: #eaf1ea; color: #3d6b4f; }
.c4 { background: #f5efdf; color: var(--amber); }
.c5 { background: #ece9f2; color: #5a4d7c; }

.kk-name {
  font-size: 14.5px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--ink);
}

.kk-desc {
  font-size: 11.5px;
  color: var(--text-3);
  letter-spacing: 0.05em;
}

/* ---------- 通用区块 ---------- */
.sec {
  padding-top: 58px;
}

.grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}

.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

@media (max-width: 1023px) {
  .grid-4 { grid-template-columns: repeat(2, 1fr); }
  .grid-3 { grid-template-columns: repeat(2, 1fr); }
  .kingkong { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 599px) {
  .grid-4, .grid-3 { grid-template-columns: 1fr; }
  .kingkong { grid-template-columns: repeat(2, 1fr); }
}

/* ---------- 深色带 ---------- */
.sec-band {
  margin-top: 58px;
  background: var(--indigo-mist);
  border-block: 1px solid var(--line);
}

.sec-band .sec {
  padding-bottom: 54px;
}

/* ---------- 文化故事 ---------- */
.story-band {
  margin-top: 64px;
  background:
    radial-gradient(ellipse at 85% 20%, rgba(192, 138, 45, 0.12), transparent 50%),
    var(--indigo-deep);
  color: var(--silver-light);
}

.story-inner {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 44px;
  align-items: center;
  padding: 56px 0;
}

.story-img {
  width: 100%;
  border-radius: var(--radius-lg);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(215, 224, 230, 0.2);
}

.story-text em {
  font-style: normal;
  font-size: 11px;
  letter-spacing: 0.5em;
  color: var(--amber);
}

.story-text h2 {
  font-size: clamp(24px, 3.4vw, 36px);
  color: var(--silver-light);
  margin: 10px 0 14px;
}

.story-text p {
  font-size: 14px;
  line-height: 2;
  color: rgba(215, 224, 230, 0.75);
  max-width: 560px;
}

.story-btn {
  margin-top: 22px;
  border-color: rgba(215, 224, 230, 0.5);
  color: var(--silver-light);
}

.story-btn:hover {
  background: var(--amber);
  border-color: var(--amber);
  color: var(--indigo-night);
}

@media (max-width: 767px) {
  .story-inner {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

/* ---------- 社区瀑布流 ---------- */
.waterfall {
  columns: 4 240px;
  column-gap: 16px;
}
</style>
