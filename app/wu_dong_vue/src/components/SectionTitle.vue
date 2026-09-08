<script setup lang="ts">
defineProps<{
  eyebrow?: string
  title: string
  more?: string
  dark?: boolean
}>()
</script>

<template>
  <div class="sec-head" :class="{ dark }">
    <div class="left rise">
      <span v-if="eyebrow" class="eyebrow">{{ eyebrow }}</span>
      <h2 class="h-display">{{ title }}</h2>
      <div class="miao-divider"><i></i><i></i><i></i><i></i></div>
    </div>
    <router-link v-if="more" :to="more" class="more">
      查看全部 <span>→</span>
    </router-link>
  </div>
</template>

<style scoped>
.sec-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 26px;
}

.eyebrow {
  display: block;
  font-size: 12px;
  letter-spacing: 0.5em;
  color: var(--accent);
  margin-bottom: 6px;
  text-transform: uppercase;
}

h2 {
  font-size: clamp(22px, 3vw, 30px);
}

.miao-divider {
  max-width: 180px;
  margin-top: 10px;
  color: rgba(35, 69, 107, 0.4);
}

.dark .miao-divider {
  color: rgba(215, 224, 230, 0.4);
}

.dark h2 {
  color: var(--silver-light);
}

.more {
  font-size: 13px;
  letter-spacing: 0.1em;
  color: var(--text-2);
  white-space: nowrap;
  padding-bottom: 6px;
  transition: color 0.2s;
}

.more:hover {
  color: var(--accent);
}

.more span {
  transition: transform 0.2s;
  display: inline-block;
}

.more:hover span {
  transform: translateX(4px);
}
</style>
