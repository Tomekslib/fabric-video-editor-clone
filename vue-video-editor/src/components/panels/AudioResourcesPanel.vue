<script setup lang="ts">
import { ref } from 'vue';
import { useEditorStore } from '@/store';
import UploadButton from '../shared/UploadButton.vue';

const store = useEditorStore();

function handleAudioUpload(files: File[]) {
  for (const file of files) {
    if (!file.type.includes('audio/')) continue;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const audioUrl = e.target?.result as string;
      store.addAudioResource(audioUrl);
    };
    reader.readAsDataURL(file);
  }
}

function addAudioToCanvas(index: number) {
  store.addAudio(index);
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center p-4">
      <h2 class="text-lg font-bold">Audio Files</h2>
      <UploadButton 
        accept="audio/*" 
        label="Upload Audio" 
        @onUpload="handleAudioUpload" 
      />
    </div>
    
    <div class="px-4 mb-4">
      <div class="grid grid-cols-1 gap-2">
        <div 
          v-for="(audio, index) in store.audios" 
          :key="index"
          class="relative group cursor-pointer bg-slate-700 p-2 rounded-md"
          @click="addAudioToCanvas(index)"
        >
          <audio 
            :id="`audio-${index}`" 
            :src="audio" 
            class="w-full"
            controls
            preload="metadata"
          />
          <div class="mt-2 flex justify-between items-center">
            <span class="text-sm truncate">Audio {{ index + 1 }}</span>
            <button 
              class="text-xs bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded"
              @click.stop="addAudioToCanvas(index)"
            >
              Add to timeline
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