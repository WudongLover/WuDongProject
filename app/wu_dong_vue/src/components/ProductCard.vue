<script setup lang="ts">
import type { Product } from '@/types'

defineProps<{ item: Product }>()
</script>

<template>
  <router-link :to="`/product/${item.id}`" class="product-card">
    <div class="cover">
      <img :src="item.cover" :alt="item.title" loading="lazy" />
      <span class="cat-tag">{{ item.category }}</span>
      <span v-if="item.stock <= 5" class="stock-tag">仅剩 {{ item.stock }} 件</span>
    </div>
    <div class="body">
      <h3>{{ item.title }}</h3>
      <p class="sub">{{ item.subtitle }}</p>
      <div class="meta">
        <span class="price">{{ item.price }}</span>
        <span v-if="item.marketPrice" class="market">¥{{ item.marketPrice }}</span>
        <span class="sales">已售 {{ item.sales }}</span>
      </div>
      <div class="foot">
        <span class="rating">★ {{ item.rating.toFixed(1) }}</span>
        <span class="shop">{{ item.module === 'GOODS' ? '非遗工坊直供' : '产地直发' }}</span>
      </div>
    </div>
  </router-link>
</template>

<style scoped>
.product-card {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: transform 0.3s var(--ease), box-shadow 0.3s var(--ease), border-color 0.3s;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-2);
  border-color: rgba(35, 69, 107, 0.3);
}

.cover {
  position: relative;
  aspect-ratio: 1 / 0.86;
  overflow: hidden;
  background: var(--indigo-mist);
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s var(--ease);
}

.product-card:hover .cover img {
  transform: scale(1.06);
}

.cat-tag {
  position: absolute;
  left: 10px;
  top: 10px;
  background: rgba(22, 48, 77, 0.85);
  color: var(--silver-light);
  font-size: 11px;
  letter-spacing: 0.15em;
  padding: 3px 9px;
  border-radius: 3px;
}

.stock-tag {
  position: absolute;
  right: 10px;
  top: 10px;
  background: rgba(181, 68, 46, 0.92);
  color: #fff;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 3px;
}

.body {
  padding: 13px 15px 15px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

h3 {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sub {
  font-size: 12px;
  color: var(--text-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 2px;
}

.price {
  font-size: 19px;
}

.market {
  font-size: 12px;
  color: var(--text-3);
  text-decoration: line-through;
}

.sales {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-3);
}

.foot {
  display: flex;
  justify-content: space-between;
  border-top: 1px dashed var(--line);
  padding-top: 8px;
  font-size: 12px;
}

.rating {
  color: var(--amber);
  font-weight: 600;
}

.shop {
  color: var(--text-3);
}
</style>
