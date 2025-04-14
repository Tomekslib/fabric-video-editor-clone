<script setup lang="ts">
import { ref } from 'vue';
import { useEditorStore } from '@/store';
import UploadButton from '../shared/UploadButton.vue';

const store = useEditorStore();

function handleVideoUpload(files: File[]) {
  for (const file of files) {
    if (!file.type.includes('video/')) continue;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const videoUrl = e.target?.result as string;
      store.addVideoResource(videoUrl);
    };
    reader.readAsDataURL(file);
  }
}

function addVideoToCanvas(index: number) {
  store.addVideo(index);
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center p-4">
      <h2 class="text-lg font-bold">Videos</h2>
      <UploadButton 
        accept="video/*" 
        label="Upload Video" 
        @onUpload="handleVideoUpload" 
      />
    </div>
    
    <div class="px-4 mb-4 max-h-[300px] overflow-auto">
      <div class="grid grid-cols-2 gap-2">
        <div 
          v-for="(video, index) in store.videos" 
          :key="index"
          class="relative group cursor-pointer"
          @click="addVideoToCanvas(index)"
        >
          <video 
            :id="`video-${index}`" 
            :src="video" 
            class="w-full h-auto bg-slate-700 rounded-md"
            preload="auto" 
            muted
            crossorigin="anonymous"
            playsinline
            @loadedmetadata="() => console.log(`Video ${index} metadata loaded`)"
            @canplay="() => console.log(`Video ${index} can play`)"
          />
          <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span class="text-white text-sm">Add to canvas</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add your styles here */
</style>