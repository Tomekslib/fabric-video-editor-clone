<script setup lang="ts">
import { ref } from 'vue';
import { useEditorStore } from '@/store';
import UploadButton from '../shared/UploadButton.vue';

const store = useEditorStore();

function handleImageUpload(files: File[]) {
  for (const file of files) {
    if (!file.type.includes('image/')) continue;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      store.addImageResource(imageUrl);
    };
    reader.readAsDataURL(file);
  }
}

function addImageToCanvas(index: number) {
  store.addImage(index);
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center p-4">
      <h2 class="text-lg font-bold">Images</h2>
      <UploadButton 
        accept="image/*" 
        label="Upload Image" 
        @onUpload="handleImageUpload" 
      />
    </div>
    
    <div class="px-4 mb-4 max-h-[300px] overflow-auto">
      <div class="grid grid-cols-2 gap-2">
        <div 
          v-for="(image, index) in store.images" 
          :key="index"
          class="relative group cursor-pointer"
          @click="addImageToCanvas(index)"
        >
          <img 
            :id="`image-${index}`" 
            :src="image" 
            class="w-full h-auto bg-slate-700 rounded-md object-cover"
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