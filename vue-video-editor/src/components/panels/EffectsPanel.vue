<script setup lang="ts">
import { computed } from 'vue';
import { useEditorStore } from '@/store';
import type { Effect, EffecType } from '@/types';

const store = useEditorStore();

const selectedElementId = computed(() => store.selectedElement?.id);
const hasSelectedElement = computed(() => !!selectedElementId.value);
const canApplyEffect = computed(() => {
  if (!store.selectedElement) return false;
  return store.selectedElement.type === 'video' || store.selectedElement.type === 'image';
});

const currentEffect = computed(() => {
  if (!canApplyEffect.value || !store.selectedElement) return { type: 'none' };
  return (store.selectedElement.type === 'video' || store.selectedElement.type === 'image') 
    ? store.selectedElement.properties.effect 
    : { type: 'none' };
});

const effectOptions: { label: string, value: EffecType }[] = [
  { label: 'None', value: 'none' },
  { label: 'Black & White', value: 'blackAndWhite' },
  { label: 'Sepia', value: 'sepia' },
  { label: 'Invert', value: 'invert' },
  { label: 'Saturate', value: 'saturate' },
];

function applyEffect(effectType: EffecType) {
  if (!canApplyEffect.value || !selectedElementId.value) return;
  
  const effect: Effect = { type: effectType };
  store.updateEffect(selectedElementId.value, effect);
}
</script>

<template>
  <div class="p-4">
    <h2 class="text-lg font-bold mb-4">Effects</h2>
    
    <div v-if="!hasSelectedElement" class="text-slate-400 text-center p-4">
      Select a video or image element to apply effects
    </div>
    
    <div v-else-if="!canApplyEffect" class="text-slate-400 text-center p-4">
      Effects can only be applied to video or image elements
    </div>
    
    <div v-else class="space-y-4">
      <div class="text-sm mb-4">
        Current effect: <span class="font-medium">{{ currentEffect.type }}</span>
      </div>
      
      <div class="grid grid-cols-2 gap-2">
        <button 
          v-for="effect in effectOptions" 
          :key="effect.value"
          class="p-2 rounded-md text-center transition-colors"
          :class="{
            'bg-blue-500 hover:bg-blue-600': currentEffect.type !== effect.value,
            'bg-blue-700': currentEffect.type === effect.value,
          }"
          @click="applyEffect(effect.value)"
        >
          {{ effect.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add your styles here */
</style>