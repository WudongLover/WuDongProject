<script setup lang="ts">
import type { Homestay } from '@/types'
import AppIcon from './AppIcon.vue'

defineProps<{ item: Homestay }>()
</script>

<template>
  <router-link :to="`/stay/${item.id}`" class="stay-card card-hover">
    <div class="cover card-media">
      <img :src="item.cover" :alt="item.name" loading="lazy" />
      <span class="score">{{ Number(item.rating).toFixed(1) }}<small>分</small></span>
      <div class="card-veil">
        <span class="veil-cta">看房型 <i>→</i></span>
      </div>
    </div>
    <div class="body">
      <h3>{{ item.name }}</h3>
      <div class="tags">
        <span v-for="t in item.tags" :key="t" class="tag tag-red">{{ t }}</span>
      </div>
      <p class="intro">{{ item.intro }}</p>
      <div class="meta">
        <span class="loc"><AppIcon name="location" :size="13" /> {{ item.address }}</span>
        <span class="pp" v-if="item.rooms.length"><i>¥</i>{{ Math.min(...item.rooms.map((r) => r.price)) }}<em>起</em></span>
      </div>
    </div>
  </router-link>
</template>

<style scoped>
.stay-card {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.cover {
  position: relative;
  aspect-ratio: 16/9;
  background: var(--indigo-mist);
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.score {
  position: absolute;
  left: 12px;
  bottom: 12px;
  z-index: 4;
  background: rgba(22, 48, 77, 0.88);
  color: var(--amber);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 17px;
  padding: 3px 10px;
  border-radius: 4px;
}

.score small {
  font-size: 11px;
  color: var(--silver-light);
  margin-left: 2px;
}

.body {
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

h3 {
  font-family: var(--font-display);
  font-size: 17px;
  color: var(--ink);
}

.tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.intro {
  font-size: 12.5px;
  color: var(--text-2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta {
  margin-top: auto;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
}

.loc {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  color: var(--text-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pp {
  font-family: var(--font-display);
  color: var(--accent);
  font-weight: 700;
  font-size: 18px;
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
