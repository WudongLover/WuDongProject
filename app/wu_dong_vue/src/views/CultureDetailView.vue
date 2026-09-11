<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { cultureSections, findCultureStory, relatedCultureStories } from '@/api'
import type { CultureModule } from '@/types'
import CultureCard from '@/components/CultureCard.vue'
import EmptyState from '@/components/EmptyState.vue'

const route = useRoute()

const story = computed(() => findCultureStory(String(route.params.id)))
const section = computed(() => cultureSections.find((s) => s.module === story.value?.module))
const siblings = computed(() => section.value?.stories.filter((s) => s.id !== story.value?.id) ?? [])
const related = computed(() => (story.value ? relatedCultureStories(story.value, 3) : []))

/** 模块 → 中文单字 / 列表页路由 */
const moduleGlyph: Record<CultureModule, string> = { YI: '衣', SHI: '食', ZHU: '住', XING: '行' }
const modulePath: Record<CultureModule, string> = {
  YI: '/goods',
  SHI: '/food',
  ZHU: '/stay',
  XING: '/trip',
}
</script>

<template>
  <div class="culture-page container">
    <EmptyState v-if="!story" text="这段内容还没写下来">
      <router-link to="/" class="btn btn-outline">回首页</router-link>
    </EmptyState>

    <template v-else>
      <nav class="crumbs">
        <router-link to="/">首页</router-link><span>/</span>
        <router-link :to="modulePath[story.module]">
          {{ moduleGlyph[story.module] }} · {{ section?.title }}
        </router-link>
        <span>/</span>
        <b>{{ story.title }}</b>
      </nav>

      <header class="cd-head">
        <em class="cd-eyebrow">{{ story.eyebrow }}</em>
        <h1>{{ story.title }}</h1>
        <p class="cd-summary">{{ story.summary }}</p>
      </header>

      <div class="layout">
        <article class="main">
          <figure class="cd-cover">
            <img :src="story.cover" :alt="story.title" />
          </figure>

          <blockquote v-if="story.quote" class="cd-quote">{{ story.quote }}</blockquote>

          <div class="cd-content">
            <p v-for="(p, i) in story.paragraphs" :key="i">{{ p }}</p>
          </div>

          <div v-if="story.links?.length" class="cd-links">
            <p class="cd-links-tip">看完了，去看看能带走、能住下、能走一走的</p>
            <router-link
              v-for="(l, i) in story.links"
              :key="l.to + l.label"
              :to="l.to"
              class="btn"
              :class="i === 0 ? 'btn-primary' : 'btn-outline'"
            >
              {{ l.label }}
            </router-link>
          </div>

          <router-link :to="modulePath[story.module]" class="cd-back">
            ← 回到{{ moduleGlyph[story.module] }} · 全部
          </router-link>
        </article>

        <aside class="side">
          <h4 class="side-title">本模块其他段落</h4>
          <ul class="side-list">
            <li v-for="s in siblings" :key="s.id">
              <router-link :to="`/culture/${s.id}`">
                <b>{{ s.title }}</b>
                <span>{{ s.eyebrow }}</span>
              </router-link>
            </li>
          </ul>
        </aside>
      </div>

      <section v-if="related.length" class="cd-related">
        <h3 class="h-display">接着读</h3>
        <div class="cd-related-grid card-grid">
          <CultureCard
            v-for="(s, i) in related"
            :key="s.id"
            :story="s"
            class="rise"
            :style="{ animationDelay: `${i * 70}ms` }"
          />
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.culture-page {
  padding-top: 26px;
}

.crumbs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12.5px;
  color: var(--text-3);
  margin-bottom: 22px;
}

.crumbs a:hover {
  color: var(--primary);
}

.crumbs b {
  font-weight: 500;
  color: var(--text-2);
}

.cd-head {
  max-width: 780px;
}

.cd-eyebrow {
  display: block;
  font-style: normal;
  font-size: 11.5px;
  letter-spacing: 0.5em;
  color: var(--accent);
  margin-bottom: 12px;
}

.cd-head h1 {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(24px, 3.4vw, 38px);
  line-height: 1.4;
  letter-spacing: 0.06em;
  color: var(--ink);
}

.cd-summary {
  margin-top: 14px;
  font-size: 14.5px;
  line-height: 2;
  color: var(--text-2);
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 44px;
  align-items: start;
  margin-top: 30px;
}

.cd-cover {
  margin: 0;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--line);
}

.cd-cover img {
  width: 100%;
  max-height: 460px;
  object-fit: cover;
}

.cd-quote {
  margin-top: 26px;
  padding: 16px 22px;
  border-left: 3px solid var(--amber);
  border-radius: 0 var(--radius) var(--radius) 0;
  background: var(--indigo-mist);
  font-family: var(--font-display);
  font-size: 16px;
  line-height: 2;
  color: var(--primary);
}

.cd-content {
  margin-top: 26px;
}

/* 与 PostDetailView 的正文排版对齐 */
.cd-content p {
  font-size: 15.5px;
  line-height: 2.2;
  color: var(--text);
}

.cd-content p + p {
  margin-top: 18px;
}

.cd-links {
  margin-top: 34px;
  padding: 24px;
  background: var(--paper-2);
  border-radius: var(--radius-lg);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
}

.cd-links-tip {
  width: 100%;
  margin-bottom: 2px;
  font-size: 13px;
  letter-spacing: 0.08em;
  color: var(--text-2);
}

.cd-back {
  display: inline-block;
  margin-top: 30px;
  font-size: 13px;
  color: var(--text-3);
  transition: color 0.2s;
}

.cd-back:hover {
  color: var(--primary);
}

.side {
  position: sticky;
  top: 84px;
}

.side-title {
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
  font-family: var(--font-display);
  font-size: 15px;
  color: var(--ink);
}

.side-list li + li {
  border-top: 1px dashed var(--line);
}

.side-list a {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 12px 0;
}

.side-list b {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.5;
  color: var(--ink);
  transition: color 0.2s;
}

.side-list span {
  font-size: 11px;
  letter-spacing: 0.2em;
  color: var(--text-3);
}

.side-list a:hover b {
  color: var(--accent);
}

.cd-related {
  margin-top: 64px;
  padding-top: 44px;
  border-top: 1px solid var(--line);
}

.cd-related h3 {
  margin-bottom: 22px;
  font-size: clamp(20px, 2.4vw, 26px);
}

.cd-related-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

@media (max-width: 1023px) {
  .layout {
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .side {
    position: static;
  }

  .cd-related-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 599px) {
  .cd-related-grid {
    grid-template-columns: 1fr;
  }
}
</style>
