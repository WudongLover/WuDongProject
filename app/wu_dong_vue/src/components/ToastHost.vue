<script setup lang="ts">
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
</script>

<template>
  <div id="toast-root">
    <transition-group name="toast">
      <div v-for="t in userStore.toastQueue" :key="t.id" class="toast">{{ t.text }}</div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s var(--ease);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
