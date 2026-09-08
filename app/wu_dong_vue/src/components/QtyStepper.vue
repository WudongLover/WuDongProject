<script setup lang="ts">
import AppIcon from './AppIcon.vue'

const props = defineProps<{ modelValue: number; max: number; min?: number }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: number): void }>()

function dec() {
  const min = props.min ?? 1
  if (props.modelValue > min) emit('update:modelValue', props.modelValue - 1)
}

function inc() {
  if (props.modelValue < props.max) emit('update:modelValue', props.modelValue + 1)
}
</script>

<template>
  <div class="stepper">
    <button :disabled="modelValue <= (min ?? 1)" aria-label="减少" @click="dec"><AppIcon name="minus" :size="13" /></button>
    <b>{{ modelValue }}</b>
    <button :disabled="modelValue >= max" aria-label="增加" @click="inc"><AppIcon name="plus" :size="13" /></button>
  </div>
</template>

<style scoped>
.stepper {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  overflow: hidden;
  background: #fff;
}

button {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  color: var(--text-2);
  transition: all 0.15s;
}

button:hover:not(:disabled) {
  background: var(--indigo);
  color: #fff;
}

button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

b {
  min-width: 34px;
  text-align: center;
  font-size: 13px;
  border-inline: 1px solid var(--line);
  align-self: stretch;
  display: grid;
  place-items: center;
}
</style>
