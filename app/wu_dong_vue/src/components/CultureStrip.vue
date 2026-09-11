<script setup lang="ts">
import type { CultureStory } from '@/types'
import { getCultureSection } from '@/api'

const props = defineProps<{ story: CultureStory }>()

/** 同模块的其他段落：各自独立成卡，点进去能继续读，而不是回到商品 */
const more = getCultureSection(props.story.module)?.stories.filter((s) => s.id !== props.story.id) ?? []
</script>

<template>
  <!-- 首页模块区用：标题由上方 SectionTitle 提供 -->
  <div class="culture-strip">
    <!-- 主推段落 -->
    <router-link :to="`/culture/${story.id}`" class="cs-main card-hover">
      <div class="cs-cover card-media">
        <img :src="story.cover" :alt="story.title" loading="lazy" />
        <div class="card-veil">
          <span class="veil-cta">读这一段 <i>→</i></span>
        </div>
      </div>
      <div class="cs-body">
        <em class="cs-eyebrow">{{ story.eyebrow }}</em>
        <h3>{{ story.title }}</h3>
        <p v-if="story.quote" class="cs-quote">{{ story.quote }}</p>
        <span class="cs-more">读这一段 <i>→</i></span>
      </div>
    </router-link>

    <!-- 同模块其他段落，各自一张卡；悬浮时从顶部展开配图 -->
    <ul v-if="more.length" class="cs-list card-grid">
      <li v-for="s in more" :key="s.id">
        <router-link :to="`/culture/${s.id}`" class="cs-item card-hover">
          <div class="cs-item-cover">
            <div class="cs-item-cover-inner">
              <img :src="s.cover" :alt="s.title" loading="lazy" />
            </div>
          </div>
          <em class="cs-eyebrow">{{ s.eyebrow }}</em>
          <b>{{ s.title }}</b>
          <span>{{ s.summary }}</span>
          <i class="cs-arrow">→</i>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.culture-strip {
  display: grid;
  grid-template-columns: minmax(0, 1.32fr) minmax(0, 1fr);
  gap: 18px;
  align-items: stretch;
}

/* ---------- 主推卡：图左文右，文字有下限宽避免被挤成窄条 ---------- */
.cs-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(240px, 0.92fr);
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  overflow: hidden;
  /* 图文大卡：幅度收一点，避免文字被推近的图片带糊 */
  --card-scale: 1.013;
  --card-lift: -4px;
}

.cs-cover {
  background: var(--indigo-mist);
  min-height: 220px;
}

.cs-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cs-body {
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  justify-content: center;
}

.cs-eyebrow {
  display: block;
  font-style: normal;
  font-size: 11px;
  letter-spacing: 0.3em;
  color: var(--accent);
}

.cs-main .cs-eyebrow {
  font-size: 11.5px;
}

h3 {
  font-family: var(--font-display);
  font-size: 21px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.42;
}

.cs-quote {
  font-family: var(--font-display);
  font-size: 13.5px;
  line-height: 1.95;
  color: var(--text-2);
}

.cs-more {
  margin-top: 6px;
  font-size: 12.5px;
  letter-spacing: 0.12em;
  color: var(--text-3);
  transition: color 0.2s;
}

.cs-more i {
  font-style: normal;
  display: inline-block;
  transition: transform 0.2s;
}

.cs-main:hover .cs-more {
  color: var(--primary);
}

.cs-main:hover .cs-more i {
  transform: translateX(4px);
}

/* ---------- 其他段落：独立卡片，纵向排列 ---------- */
.cs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cs-item {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 40px 16px 20px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  overflow: hidden;
  --card-scale: 1.018;
  --card-lift: -3px;
}

/* ---------- 悬浮配图：从顶部平滑展开，上图下文 ---------- */
.cs-item-cover {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.55s var(--ease);
  /* 突破卡片 padding，让配图贴满顶边与左右 */
  margin: -16px -40px 12px -20px;
}

.cs-item-cover-inner {
  overflow: hidden;
  min-height: 0;
  background: var(--indigo-mist);
}

.cs-item-cover-inner img {
  width: 100%;
  aspect-ratio: 16 / 8;
  object-fit: cover;
  opacity: 0;
  transform: scale(1.04);
  transition:
    opacity 0.4s var(--ease),
    transform 0.6s var(--ease);
}

.cs-item:hover .cs-item-cover {
  grid-template-rows: 1fr;
}

.cs-item:hover .cs-item-cover-inner img {
  opacity: 1;
  transform: scale(1);
}

.cs-item b {
  font-family: var(--font-display);
  font-size: 15.5px;
  font-weight: 700;
  line-height: 1.45;
  color: var(--ink);
  transition: color 0.2s;
}

.cs-item span {
  font-size: 12.5px;
  line-height: 1.8;
  color: var(--text-3);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.cs-item .cs-arrow {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  font-style: normal;
  font-size: 14px;
  color: var(--text-3);
  opacity: 0;
  transition: opacity 0.25s, transform 0.25s;
  z-index: 2;
}

.cs-item:hover b {
  color: var(--accent);
}

.cs-item:hover .cs-arrow {
  opacity: 1;
  transform: translateY(-50%) translateX(3px);
  color: var(--accent);
}

@media (max-width: 1023px) {
  .culture-strip {
    grid-template-columns: 1fr;
  }

  .cs-list {
    flex-direction: row;
  }

  .cs-item {
    flex: 1;
    min-width: 0;
  }
}

@media (max-width: 767px) {
  .cs-main {
    grid-template-columns: 1fr;
  }

  .cs-cover {
    aspect-ratio: 16 / 9;
    min-height: 0;
  }

  .cs-body {
    padding: 18px;
  }

  .cs-list {
    flex-direction: column;
  }

  .cs-item {
    padding: 14px 36px 14px 16px;
  }

  .cs-item-cover {
    margin: -14px -36px 10px -16px;
  }
}

/* 触屏没有真正的悬停，禁止配图展开，避免点击后效果粘住 */
@media (hover: none) {
  .cs-item-cover {
    display: none;
  }
}

/* 尊重减少动效偏好：展开与图片缩放动画全部关闭 */
@media (prefers-reduced-motion: reduce) {
  .cs-item-cover,
  .cs-item-cover-inner img {
    transition: none;
  }
}
</style>
