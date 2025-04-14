<script setup lang="ts">
import { computed, ref } from 'vue';
import { useEditorStore } from '@/store';

const props = defineProps<{
  seek: number;
  maxTime: number;
}>();

const emit = defineEmits<{
  (e: 'onSeek', value: number): void;
}>();

const store = useEditorStore();

const percent = computed(() => {
  return (props.seek / props.maxTime) * 100;
});

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function handleClick(e: MouseEvent) {
  // Make sure we get the correct element (the seekbar not the thumb)
  const seekbar = e.currentTarget as HTMLElement;
  const rect = seekbar.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const percent = x / rect.width;
  const newTime = percent * props.maxTime;
  emit('onSeek', newTime);
}
</script>

<template>
  <div class="mb-4">
    <div class="h-[26px]">
      <div class="h-full flex justify-between items-center">
        <p class="text-xs text-white">{{ formatTime(props.seek) }}</p>
        <button 
          class="text-sm bg-blue-500 hover:bg-blue-600 p-1 rounded-md text-white flex items-center justify-center h-6 w-6"
          @click="store.setPlaying(!store.playing)"
        >
          {{ store.playing ? '⏸️' : '▶️' }}
        </button>
        <p class="text-xs text-white">{{ formatTime(props.maxTime) }}</p>
      </div>
    </div>
    <div class="relative h-6 w-full bg-slate-700 rounded-md cursor-pointer" @click="handleClick">
      <div 
        class="absolute top-0 h-full bg-blue-500 rounded-md"
        :style="{ width: percent + '%' }"
      ></div>
      <div 
        class="absolute top-0 h-full rounded-full bg-white w-2 transform -translate-x-1/2"
        :style="{ left: percent + '%' }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
/* Add your styles here */
</style>