<script setup lang="ts">
import { ref } from 'vue';
import { useEditorStore } from '@/store';

const store = useEditorStore();

const isExporting = ref(false);

function exportVideo() {
  isExporting.value = true;
  try {
    store.saveCanvasToVideoWithAudio();
  } catch (error) {
    console.error('Export failed:', error);
  } finally {
    isExporting.value = false;
  }
}
</script>

<template>
  <div class="p-4">
    <h2 class="text-lg font-bold mb-4">Export Video</h2>
    
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-1">Video Format</label>
        <div class="flex space-x-2">
          <button 
            v-for="format in store.possibleVideoFormats" 
            :key="format"
            class="flex-1 p-2 rounded-md transition-colors"
            :class="{
              'bg-blue-600': store.selectedVideoFormat === format,
              'bg-slate-600 hover:bg-slate-500': store.selectedVideoFormat !== format
            }"
            @click="store.setVideoFormat(format as 'mp4' | 'webm')"
          >
            {{ format.toUpperCase() }}
          </button>
        </div>
      </div>
      
      <div class="pt-2">
        <button 
          @click="exportVideo" 
          class="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          :disabled="isExporting"
        >
          <span v-if="isExporting">Exporting...</span>
          <span v-else>Export Video</span>
        </button>
      </div>
      
      <div class="text-xs text-slate-400 mt-2">
        <p>Note: Video export may take some time depending on the complexity of your project.</p>
        <p class="mt-1">Supported formats: MP4, WebM</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add your styles here */
</style>