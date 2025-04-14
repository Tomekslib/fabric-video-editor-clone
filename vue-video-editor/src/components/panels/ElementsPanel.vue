<script setup lang="ts">
import { computed } from 'vue';
import { useEditorStore } from '@/store';

const store = useEditorStore();

const elementList = computed(() => store.editorElements);
const selectedElement = computed(() => store.selectedElement);

function selectElement(id: string) {
  const element = store.editorElements.find((e) => e.id === id);
  if (element) {
    store.setSelectedElement(element);
  }
}

function unselectElement() {
  store.setSelectedElement(null);
}
</script>

<template>
  <div class="bg-slate-800 h-full text-white p-2">
    <div class="flex flex-col bg-slate-700 h-full rounded-md p-2">
      <h3 class="text-lg font-bold mb-2">Elements</h3>
      <div class="flex flex-col gap-1 flex-1 overflow-scroll">
        <div 
          v-for="element in elementList" 
          :key="element.id"
          class="p-2 rounded-md cursor-pointer hover:bg-slate-600"
          :class="{
            'bg-slate-600': selectedElement && selectedElement.id === element.id,
          }"
          @click="selectElement(element.id)"
        >
          <p>{{ element.name }}</p>
          <p class="text-xs">{{ element.type }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add your styles here */
</style>