<script setup lang="ts">
import type { Post } from '@/types'
import AppIcon from './AppIcon.vue'

defineProps<{ item: Post }>()
</script>

<template>
  <router-link :to="`/posts/${item.id}`" class="post-card card-hover">
    <div class="cover card-media">
      <img :src="item.images[0]" :alt="item.title" loading="lazy" />
      <img
        v-if="item.images[1]"
        class="img-alt"
        :src="item.images[1]"
        alt=""
        aria-hidden="true"
        loading="lazy"
      />
      <span v-if="item.images.length > 1" class="count"><AppIcon name="camera" :size="12" /> {{ item.images.length }}</span>
      <div class="card-veil">
        <span class="veil-cta">看全文 <i>→</i></span>
      </div>
    </div>
    <div class="body">
      <h3>{{ item.title }}</h3>
      <p v-if="item.topic" class="topic">{{ item.topic }} <i v-if="item.place">@ {{ item.place }}</i></p>
      <div class="meta">
        <span class="author">
          <img :src="item.author.avatar" :alt="item.author.name" />
          {{ item.author.name }}
        </span>
        <span class="likes" :class="{ on: item.liked }"><AppIcon name="heart" :size="13" /> {{ item.likes }}</span>
      </div>
    </div>
  </router-link>
</template>

<style scoped>
.post-card {
  break-inside: avoid;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: 16px;
}

.cover {
  position: relative;
  background: var(--indigo-mist);
}

.cover img {
  width: 100%;
}

/* 多图笔记：悬停时第一张淡出、第二张淡入 */
.img-alt {
  position: absolute;
  inset: 0;
  height: 100%;
  object-fit: cover;
  opacity: 0;
}

.post-card:hover .img-alt,
.post-card:focus-visible .img-alt {
  opacity: 1;
}

.count {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 4;
  background: rgba(22, 48, 77, 0.82);
  color: var(--silver-light);
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.body {
  padding: 11px 13px 13px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

h3 {
  font-size: 14.5px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.topic {
  font-size: 12px;
  color: var(--primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topic i {
  font-style: normal;
  color: var(--text-3);
}

.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.author {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-2);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.author img {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  flex: none;
}

.likes {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-3);
  flex: none;
}

.likes :deep(svg) {
  color: rgba(181, 68, 46, 0.7);
}

.likes.on {
  color: var(--accent);
  font-weight: 700;
}

.likes.on :deep(svg) {
  color: var(--accent);
  fill: var(--accent);
}
</style>
