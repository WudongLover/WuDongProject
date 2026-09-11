<script setup lang="ts">
import type { CultureStory } from '@/types'

defineProps<{ story: CultureStory }>()
</script>

<template>
  <router-link :to="`/culture/${story.id}`" class="culture-card card-hover">
    <div class="cover card-media">
      <img :src="story.cover" :alt="story.title" loading="lazy" />
      <div class="card-veil">
        <span class="veil-cta">读这一段 <i>→</i></span>
      </div>
    </div>
    <div class="body">
      <em class="eyebrow">{{ story.eyebrow }}</em>
      <h3>{{ story.title }}</h3>
      <p class="summary">{{ story.summary }}</p>
      <span class="more">读这一段 <i>→</i></span>
    </div>
  </router-link>
</template>

<style scoped>
.culture-card {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.cover {
  aspect-ratio: 4 / 3;
  background: var(--indigo-mist);
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.body {
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  flex: 1;
}

.eyebrow {
  font-style: normal;
  font-size: 11px;
  letter-spacing: 0.28em;
  color: var(--accent);
}

h3 {
  font-family: var(--font-display);
  font-size: 16.5px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.45;
}

.summary {
  font-size: 13px;
  line-height: 1.95;
  color: var(--text-2);
}

.more {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px dashed var(--line);
  font-size: 12px;
  letter-spacing: 0.12em;
  color: var(--text-3);
  transition: color 0.2s;
}

.more i {
  font-style: normal;
  display: inline-block;
  transition: transform 0.2s;
}

.culture-card:hover .more {
  color: var(--primary);
}

.culture-card:hover .more i {
  transform: translateX(4px);
}
</style>
