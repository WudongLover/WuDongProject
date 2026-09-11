<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as api from '@/api'
import type { Banner, LiveInfo, Post } from '@/types'
import SectionTitle from '@/components/SectionTitle.vue'
import PostCard from '@/components/PostCard.vue'
import AppIcon from '@/components/AppIcon.vue'
import CultureStrip from '@/components/CultureStrip.vue'
import { scene } from '@/mock/images'

/**
 * 首页只做文旅介绍，不做商品陈列：卡片、价格、销量一概不上。
 * 想买东西的人从导航或每个模块的「查看全部」进列表页。
 */
const yi = api.getCultureSection('YI')
const shi = api.getCultureSection('SHI')
const zhu = api.getCultureSection('ZHU')
const xing = api.getCultureSection('XING')

/** 词条跳文化内容：文案对上就跳对应段落，对不上退回该模块列表页 */
function entryTo(kw: string, fallback: string) {
  const hit = api.cultureEntries.find((e) => e.label === kw)
  return hit ? `/culture/${hit.storyId}` : fallback
}

const banners = ref<Banner[]>([])
const announcements = ref<string[]>([])
const posts = ref<Post[]>([])
const hotKeywords = ref<string[]>([])
const live = ref<LiveInfo | null>(null)

const cur = ref(0)
let timer: ReturnType<typeof setInterval> | undefined
let liveTimer: ReturnType<typeof setInterval> | undefined

function go(i: number) {
  cur.value = (i + banners.value.length) % banners.value.length
}

async function loadLive() {
  try {
    const res = await api.getLiveInfo()
    live.value = res.data
  } catch {
    live.value = null
  }
}

onMounted(async () => {
  // 首页不再拉商品/餐厅/民宿/路线列表，只取导览与社区内容
  const res = await api.getHomeData()
  banners.value = res.data.banners
  announcements.value = res.data.announcements
  posts.value = res.data.recommends.posts
  hotKeywords.value = res.data.hotKeywords
  timer = setInterval(() => go(cur.value + 1), 5200)
  await loadLive()
  liveTimer = setInterval(loadLive, 60 * 1000)
})

onUnmounted(() => {
  clearInterval(timer)
  clearInterval(liveTimer)
})
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
            <router-link :to="b.link" class="btn btn-outline btn-lg hero-btn">了解乌东</router-link>
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
          <p>海拔 {{ live?.altitude ?? '--' }}m · 今日{{ live?.weather.text ?? '--' }} {{ live?.weather.temp ?? '--' }}℃</p>
          <ul>
            <li><AppIcon name="fire" :size="14" /> 今日游客 {{ live?.visitorsToday ?? '--' }} 人</li>
            <li><AppIcon name="star" :size="14" /> {{ live?.festival.name ?? '苗年节' }}倒计时 {{ live?.festival.daysLeft ?? '--' }} 天</li>
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
        <span>逛一逛：</span>
        <router-link v-for="k in hotKeywords.slice(0, 4)" :key="k" :to="entryTo(k, '/trip')">{{ k }}</router-link>
      </div>
    </div>

    <!-- 衣 -->
    <section class="container sec">
      <SectionTitle eyebrow="YI · INTANGIBLE HERITAGE" title="指尖上的苗艺" more="/goods" />
      <CultureStrip v-if="yi?.stories[0]" :story="yi.stories[0]" class="sec-culture rise" />
      <ul v-if="yi?.entries?.length" class="entry-row rise">
        <li v-for="e in yi.entries" :key="e.label">
          <router-link :to="e.to">{{ e.label }}</router-link>
        </li>
      </ul>
    </section>

    <!-- 食 -->
    <section class="sec-band">
      <div class="container sec">
        <SectionTitle eyebrow="SHI · TASTE OF MIAO" title="酸与火的席面" more="/food" />
        <CultureStrip v-if="shi?.stories[0]" :story="shi.stories[0]" class="sec-culture rise" />
        <ul v-if="shi?.entries?.length" class="entry-row rise">
          <li v-for="e in shi.entries" :key="e.label">
            <router-link :to="e.to">{{ e.label }}</router-link>
          </li>
        </ul>
      </div>
    </section>

    <!-- 住 -->
    <section class="container sec">
      <SectionTitle eyebrow="ZHU · MOUNTAIN LODGE" title="住进吊脚楼" more="/stay" />
      <CultureStrip v-if="zhu?.stories[0]" :story="zhu.stories[0]" class="sec-culture rise" />
      <ul v-if="zhu?.entries?.length" class="entry-row rise">
        <li v-for="e in zhu.entries" :key="e.label">
          <router-link :to="e.to">{{ e.label }}</router-link>
        </li>
      </ul>
    </section>

    <!-- 行 -->
    <section class="container sec">
      <SectionTitle eyebrow="XING · JOURNEY" title="山水与节庆" more="/trip" />
      <CultureStrip v-if="xing?.stories[0]" :story="xing.stories[0]" class="sec-culture rise" />
      <ul v-if="xing?.entries?.length" class="entry-row rise">
        <li v-for="e in xing.entries" :key="e.label">
          <router-link :to="e.to">{{ e.label }}</router-link>
        </li>
      </ul>
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
          <router-link to="/culture/yi-silver-hammer" class="btn btn-outline story-btn">读他的故事</router-link>
        </div>
      </div>
    </section>

    <!-- 社区 -->
    <section class="container sec">
      <SectionTitle eyebrow="SHEQU · COMMUNITY" title="他们正在记录乌东" more="/community" />
      <div class="waterfall card-grid">
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

/* ---------- 通用区块 ---------- */
.sec {
  padding-top: 58px;
}

/* 模块区里的文化条 */
.sec-culture {
  margin-bottom: 22px;
}

/* 无价格入口：只给名字，价格与库存留给列表页 */
.entry-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}

.entry-row a {
  display: inline-block;
  padding: 6px 18px;
  font-size: 13px;
  letter-spacing: 0.1em;
  color: var(--text-2);
  background: #fff;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  transition: all 0.2s;
}

.entry-row a:hover {
  color: var(--primary);
  border-color: var(--primary);
  background: rgba(35, 69, 107, 0.06);
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
