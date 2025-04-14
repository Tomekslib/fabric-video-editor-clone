<script setup lang="ts">
import { ref } from 'vue';
import { useEditorStore } from '@/store';

const store = useEditorStore();

const text = ref('New Text');
const fontSize = ref(36);
const fontWeight = ref(400);

function addTextToCanvas() {
  store.addText({
    text: text.value,
    fontSize: fontSize.value,
    fontWeight: fontWeight.value,
  });
}
</script>

<template>
  <div class="p-4">
    <h2 class="text-lg font-bold mb-4">Add Text</h2>
    
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-1">Text Content</label>
        <input 
          v-model="text" 
          type="text" 
          class="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white"
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium mb-1">Font Size: {{ fontSize }}px</label>
        <input 
          v-model="fontSize" 
          type="range" 
          min="10" 
          max="100" 
          step="1"
          class="w-full bg-slate-700 rounded-lg"
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium mb-1">Font Weight: {{ fontWeight }}</label>
        <select 
          v-model="fontWeight" 
          class="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white"
        >
          <option value="300">Light (300)</option>
          <option value="400">Regular (400)</option>
          <option value="500">Medium (500)</option>
          <option value="700">Bold (700)</option>
          <option value="900">Extra Bold (900)</option>
        </select>
      </div>
      
      <div class="pt-2">
        <button 
          @click="addTextToCanvas" 
          class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md transition"
        >
          Add Text to Canvas
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add your styles here */
</style>