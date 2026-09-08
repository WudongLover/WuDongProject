<script setup lang="ts">
import type { TravelRoute } from '@/types'
import AppIcon from './AppIcon.vue'

defineProps<{ item: TravelRoute }>()
</script>

<template>
  <router-link :to="`/routes/${item.id}`" class="route-card">
    <div class="cover">
      <img :src="item.cover" :alt="item.title" loading="lazy" />
      <span class="days">{{ item.days === 1 ? '一日' : item.days === 2 ? '两日' : `${item.days} 日` }}行程</span>
    </div>
    <div class="body">
      <span class="theme">{{ item.theme }}</span>
      <h3>{{ item.title }}</h3>
      <ul class="incl">
        <li v-for="i in item.includes.slice(0, 4)" :key="i"><AppIcon name="check" :size="12" />{{ i }}</li>
      </ul>
      <div class="meta">
        <span class="rate">★ {{ item.rating.toFixed(1) }} · 已售 {{ item.sales }}</span>
        <span class="pp"><i>¥</i>{{ item.price }}<em>/人</em></span>
      </div>
    </div>
  </router-link>
</template>

<style scoped>
.route-card {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: transform 0.3s var(--ease), box-shadow 0.3s var(--ease);
}

.route-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-2);
}

.cover {
  position: relative;
  aspect-ratio: 16/8.5;
  overflow: hidden;
  background: var(--indigo-mist);
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s var(--ease);
}

.route-card:hover .cover img {
  transform: scale(1.05);
}

.days {
  position: absolute;
  left: 10px;
  bottom: 10px;
  background: rgba(181, 68, 46, 0.92);
  color: #fff;
  font-size: 12px;
  letter-spacing: 0.1em;
  padding: 3px 10px;
  border-radius: 3px;
}

.body {
  padding: 13px 15px 15px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  flex: 1;
}

.theme {
  align-self: flex-start;
  font-size: 11px;
  letter-spacing: 0.18em;
  color: var(--primary);
  border: 1px solid rgba(35, 69, 107, 0.35);
  padding: 1px 8px;
  border-radius: 999px;
}

h3 {
  font-family: var(--font-display);
  font-size: 16.5px;
  color: var(--ink);
  line-height: 1.4;
}

.incl {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px 10px;
}

.incl li {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.incl li :deep(svg) {
  color: var(--amber);
  flex: none;
}

.meta {
  margin-top: auto;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  border-top: 1px dashed var(--line);
  padding-top: 9px;
}

.rate {
  font-size: 11.5px;
  color: var(--text-3);
}

.rate b {
  color: var(--amber);
}

.pp {
  font-family: var(--font-display);
  color: var(--accent);
  font-weight: 700;
  font-size: 19px;
}

.pp i {
  font-size: 11px;
}

.pp em {
  font-style: normal;
  font-size: 11px;
  color: var(--text-3);
  font-weight: 400;
}
</style>
