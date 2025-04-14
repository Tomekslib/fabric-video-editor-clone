<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  modelValue: number;
  min?: number;
  max?: number;
  step?: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
}>();

const value = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement;
  emit('update:modelValue', parseFloat(target.value));
}
</script>

<template>
  <div class="flex items-center w-full mb-2">
    <span class="text-white text-xs mr-2">Zoom</span>
    <input 
      type="range" 
      class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" 
      :min="min || 0" 
      :max="max || 1" 
      :step="step || 0.01"
      :value="value" 
      @input="handleInput"
    />
  </div>
</template>

<style scoped>
/* Add your styles here */
</style>