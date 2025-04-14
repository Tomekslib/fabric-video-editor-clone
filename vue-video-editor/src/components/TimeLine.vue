<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useEditorStore } from '@/store';
import type { EditorElement } from '@/types';
import TimeFrameView from './timeline-related/TimeFrameView.vue';
import DragableView from './timeline-related/DragableView.vue';
import SeekPlayer from './timeline-related/SeekPlayer.vue';
import ScaleRangeInput from './timeline-related/ScaleRangeInput.vue';

const store = useEditorStore();

const scaleTimelineZoom = ref(1);
const timelineWidthPx = computed(() => {
  return store.maxTime / scaleTimelineZoom.value;
});

function getElementsTypewise() {
  const audioElements = store.editorElements.filter((e) => e.type === 'audio');
  const videoAndImageElements = store.editorElements.filter(
    (e) => e.type === 'video' || e.type === 'image' || e.type === 'text'
  );
  return {
    audioElements,
    videoAndImageElements,
  };
}

const elements = computed(() => getElementsTypewise());

function deleteElement(id: string) {
  store.removeEditorElement(id);
}

function handleUpdateTimeFrame(element: EditorElement, timeFrame: { start: number; end: number }) {
  store.updateEditorElementTimeFrame(element, timeFrame);
}
</script>

<template>
  <div class="bg-slate-800 p-4 rounded-md">
    <div class="flex flex-col">
      <SeekPlayer :seek="store.currentTimeInMs" :maxTime="store.maxTime" @onSeek="store.handleSeek" />
      
      <ScaleRangeInput v-model="scaleTimelineZoom" :min="0.1" :max="2" :step="0.01" class="w-full" />
      
      <div class="overflow-auto">
        <div :style="{ minWidth: timelineWidthPx + 'px' }" class="min-h-[240px] pb-4 pt-2">
          <div>
            <p class="text-white text-sm mb-2">Audio</p>
            <div class="flex flex-col gap-1">
              <DragableView 
                v-for="element in elements.audioElements"
                :key="element.id"
                :element="element"
                :maxTime="store.maxTime"
                :current-time="store.currentTimeInMs"
                :scale-timeline-zoom="scaleTimelineZoom"
                @onUpdateTimeFrame="handleUpdateTimeFrame"
                @delete="deleteElement"
              />
            </div>
          </div>
          
          <div class="mt-4">
            <p class="text-white text-sm mb-2">Video & Image</p>
            <div class="flex flex-col gap-1">
              <TimeFrameView 
                v-for="element in elements.videoAndImageElements"
                :key="element.id"
                :element="element"
                :maxTime="store.maxTime"
                :current-time="store.currentTimeInMs"
                :scale-timeline-zoom="scaleTimelineZoom"
                @onUpdateTimeFrame="handleUpdateTimeFrame"
                @delete="deleteElement"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add your styles here */
</style>