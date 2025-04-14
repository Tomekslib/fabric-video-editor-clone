<script setup lang="ts">
import { ref, computed } from 'vue';
import { useEditorStore } from '@/store';

const store = useEditorStore();

const colorPresets = [
  '#111111', '#2d3748', '#4a5568', '#000000', 
  '#742a2a', '#7b341e', '#744210', '#22543d',
  '#1a4e82', '#2a4365', '#3c366b', '#44337a'
];

const currentColor = ref(store.backgroundColor);

function updateBackgroundColor(color: string) {
  currentColor.value = color;
  store.setBackgroundColor(color);
}
</script>

<template>
  <div class="p-4">
    <h2 class="text-lg font-bold mb-4">Background Color</h2>
    
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-2">Color</label>
        <input 
          v-model="currentColor" 
          type="color" 
          class="w-full h-10 bg-slate-700 border border-slate-600 rounded-md cursor-pointer"
          @change="updateBackgroundColor(currentColor)"
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium mb-2">Presets</label>
        <div class="grid grid-cols-4 gap-2">
          <div 
            v-for="color in colorPresets" 
            :key="color"
            class="w-full aspect-square rounded-md cursor-pointer border-2"
            :class="{
              'border-blue-400': color === currentColor,
              'border-transparent': color !== currentColor
            }"
            :style="{ backgroundColor: color }"
            @click="updateBackgroundColor(color)"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add your styles here */
</style>