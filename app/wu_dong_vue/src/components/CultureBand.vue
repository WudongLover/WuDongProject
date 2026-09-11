<script setup lang="ts">
import type { CultureSection } from '@/types'
import CultureCard from './CultureCard.vue'

defineProps<{ section: CultureSection }>()
</script>

<template>
  <section class="culture-band">
    <!-- 自带 .container：页面引用时必须放在页面级 .container 之外，否则会双层收窄 -->
    <div class="container">
      <header class="cb-head rise">
        <div class="cb-left">
          <em class="cb-eyebrow">{{ section.eyebrow }}</em>
          <h2 class="h-display">{{ section.title }}</h2>
          <div class="miao-divider"><i></i><i></i><i></i><i></i></div>
        </div>
        <p class="cb-intro">{{ section.intro }}</p>
      </header>

      <div class="cb-grid card-grid">
        <CultureCard
          v-for="(s, i) in section.stories"
          :key="s.id"
          :story="s"
          class="rise"
          :style="{ animationDelay: `${Math.min(i, 6) * 60}ms` }"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.culture-band {
  padding: 46px 0 8px;
}

.cb-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 40px;
  margin-bottom: 26px;
}

.cb-eyebrow {
  display: block;
  font-style: normal;
  font-size: 12px;
  letter-spacing: 0.5em;
  color: var(--accent);
  margin-bottom: 6px;
}

.cb-left h2 {
  font-size: clamp(22px, 3vw, 30px);
}

.cb-left .miao-divider {
  max-width: 180px;
  margin-top: 12px;
}

.cb-intro {
  max-width: 460px;
  font-size: 13.5px;
  line-height: 2.05;
  color: var(--text-2);
}

.cb-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}

@media (max-width: 1023px) {
  .cb-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }

  .cb-intro {
    max-width: none;
  }

  .cb-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 599px) {
  .cb-grid {
    grid-template-columns: 1fr;
  }
}
</style>
