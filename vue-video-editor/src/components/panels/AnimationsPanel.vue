<script setup lang="ts">
import { ref, computed } from 'vue';
import { useEditorStore } from '@/store';
import type { Animation, SlideDirection } from '@/types';
import { getUid } from '@/utils';

const store = useEditorStore();

const animationType = ref<'fadeIn' | 'fadeOut' | 'slideIn' | 'slideOut' | 'breathe'>('fadeIn');
const duration = ref(1000);
const direction = ref<SlideDirection>('left');
const useClipPath = ref(false);
const textType = ref<'none' | 'character'>('none');

const selectedElementId = computed(() => store.selectedElement?.id);
const hasSelectedElement = computed(() => !!selectedElementId.value);

const canAddAnimation = computed(() => {
  if (!hasSelectedElement.value) return false;
  return store.selectedElement?.type === 'video' || 
         store.selectedElement?.type === 'image' || 
         store.selectedElement?.type === 'text';
});

const canAddSlideAnimation = computed(() => {
  return canAddAnimation.value && ['slideIn', 'slideOut'].includes(animationType.value);
});

const canAddTextAnimation = computed(() => {
  return canAddAnimation.value && 
         store.selectedElement?.type === 'text' && 
         ['slideIn', 'slideOut'].includes(animationType.value);
});

const elementAnimations = computed(() => {
  if (!selectedElementId.value) return [];
  return store.animations.filter(a => a.targetId === selectedElementId.value);
});

function addAnimation() {
  if (!canAddAnimation.value || !selectedElementId.value) return;
  
  const id = getUid();
  let animation: Animation;
  
  switch (animationType.value) {
    case 'fadeIn':
      animation = {
        id,
        targetId: selectedElementId.value,
        type: 'fadeIn',
        duration: duration.value,
        properties: {}
      };
      break;
    case 'fadeOut':
      animation = {
        id,
        targetId: selectedElementId.value,
        type: 'fadeOut',
        duration: duration.value,
        properties: {}
      };
      break;
    case 'slideIn':
      animation = {
        id,
        targetId: selectedElementId.value,
        type: 'slideIn',
        duration: duration.value,
        properties: {
          direction: direction.value,
          useClipPath: useClipPath.value,
          textType: textType.value
        }
      };
      break;
    case 'slideOut':
      animation = {
        id,
        targetId: selectedElementId.value,
        type: 'slideOut',
        duration: duration.value,
        properties: {
          direction: direction.value,
          useClipPath: useClipPath.value,
          textType: textType.value
        }
      };
      break;
    case 'breathe':
      animation = {
        id,
        targetId: selectedElementId.value,
        type: 'breathe',
        duration: duration.value,
        properties: {}
      };
      break;
  }
  
  store.addAnimation(animation);
}

function removeAnimation(id: string) {
  store.removeAnimation(id);
}
</script>

<template>
  <div class="p-4">
    <h2 class="text-lg font-bold mb-4">Animations</h2>
    
    <div v-if="!hasSelectedElement" class="text-slate-400 text-center p-4">
      Select an element to add animations
    </div>
    
    <div v-else-if="!canAddAnimation" class="text-slate-400 text-center p-4">
      Selected element doesn't support animations
    </div>
    
    <div v-else class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-1">Animation Type</label>
        <select 
          v-model="animationType" 
          class="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white"
        >
          <option value="fadeIn">Fade In</option>
          <option value="fadeOut">Fade Out</option>
          <option value="slideIn">Slide In</option>
          <option value="slideOut">Slide Out</option>
          <option value="breathe">Breathe</option>
        </select>
      </div>
      
      <div>
        <label class="block text-sm font-medium mb-1">Duration: {{ duration }}ms</label>
        <input 
          v-model="duration" 
          type="range" 
          min="100" 
          max="5000" 
          step="100"
          class="w-full bg-slate-700 rounded-lg"
        />
      </div>
      
      <div v-if="canAddSlideAnimation">
        <label class="block text-sm font-medium mb-1">Direction</label>
        <select 
          v-model="direction" 
          class="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white"
        >
          <option value="left">Left</option>
          <option value="right">Right</option>
          <option value="top">Top</option>
          <option value="bottom">Bottom</option>
        </select>
        
        <div class="mt-2 flex items-center">
          <input 
            v-model="useClipPath" 
            type="checkbox" 
            id="use-clip-path" 
            class="mr-2"
          />
          <label for="use-clip-path" class="text-sm">Use clip path</label>
        </div>
      </div>
      
      <div v-if="canAddTextAnimation">
        <label class="block text-sm font-medium mb-1">Text Animation</label>
        <select 
          v-model="textType" 
          class="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white"
        >
          <option value="none">None</option>
          <option value="character">Character by Character</option>
        </select>
      </div>
      
      <div class="pt-2">
        <button 
          @click="addAnimation" 
          class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md transition"
        >
          Add Animation
        </button>
      </div>
      
      <div v-if="elementAnimations.length > 0" class="mt-6">
        <h3 class="text-md font-semibold mb-2">Current Animations</h3>
        <div class="space-y-2">
          <div 
            v-for="animation in elementAnimations" 
            :key="animation.id"
            class="bg-slate-700 p-2 rounded-md flex justify-between items-center"
          >
            <div>
              <span class="font-medium">{{ animation.type }}</span>
              <span class="text-xs ml-2">({{ animation.duration }}ms)</span>
            </div>
            <button 
              @click="removeAnimation(animation.id)" 
              class="text-red-400 hover:text-red-300"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add your styles here */
</style>