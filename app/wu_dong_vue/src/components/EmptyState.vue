<script setup lang="ts">
defineProps<{ text?: string }>()
</script>

<template>
  <div class="empty">
    <div class="glyph" aria-hidden="true">空</div>
    <p>{{ text || '这里还没有内容' }}</p>
    <slot />
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 56px 20px;
  color: var(--text-3);
}

.glyph {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 900;
  color: rgba(35, 69, 107, 0.35);
  border: 1.5px dashed rgba(35, 69, 107, 0.3);
  border-radius: 50%;
  transform: rotate(8deg);
}

p {
  font-size: 13px;
  letter-spacing: 0.1em;
}
</style>
