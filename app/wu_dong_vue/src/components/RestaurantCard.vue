<script setup lang="ts">
import type { Restaurant } from '@/types'
import AppIcon from './AppIcon.vue'

defineProps<{ item: Restaurant }>()
</script>

<template>
  <router-link :to="`/restaurants/${item.id}`" class="rest-card card-hover">
    <div class="cover card-media">
      <img :src="item.cover" :alt="item.name" loading="lazy" />
      <div class="card-veil">
        <span class="veil-cta">订餐位 <i>→</i></span>
      </div>
    </div>
    <div class="body">
      <div class="row">
        <h3>{{ item.name }}</h3>
        <span class="rating">★ {{ item.rating.toFixed(1) }}</span>
      </div>
      <p class="intro">{{ item.intro }}</p>
      <div class="tags">
        <span v-for="t in item.tags.slice(0, 3)" :key="t" class="tag">{{ t }}</span>
      </div>
      <div class="meta">
        <span class="loc"><AppIcon name="location" :size="13" /> {{ item.address }}</span>
        <span class="pp"><i>¥</i>{{ item.pricePerCapita }}<em>/人均</em></span>
      </div>
    </div>
  </router-link>
</template>

<style scoped>
.rest-card {
  display: flex;
  gap: 0;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  overflow: hidden;
  /* 横向卡体量大，放大倍率压低一点，避免顶到相邻内容 */
  --card-scale: 1.014;
  --card-lift: -4px;
}

.cover {
  width: 42%;
  flex: none;
  background: var(--indigo-mist);
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.body {
  padding: 15px 17px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  flex: 1;
  min-width: 0;
}

.row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

h3 {
  font-family: var(--font-display);
  font-size: 17px;
  color: var(--ink);
}

.rating {
  color: var(--amber);
  font-weight: 600;
  font-size: 13px;
}

.intro {
  font-size: 12.5px;
  color: var(--text-2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
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
  font-size: 17px;
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

@media (max-width: 599px) {
  .rest-card {
    flex-direction: column;
  }

  .cover {
    width: 100%;
    aspect-ratio: 16/8;
  }
}
</style>
