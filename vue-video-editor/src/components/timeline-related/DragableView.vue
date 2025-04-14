<script setup lang="ts">
import { computed } from 'vue';
import type { EditorElement } from '@/types';

const props = defineProps<{
  element: EditorElement;
  maxTime: number;
  currentTime: number;
  scaleTimelineZoom: number;
}>();

const emit = defineEmits<{
  (e: 'onUpdateTimeFrame', element: EditorElement, timeFrame: { start: number; end: number }): void;
  (e: 'delete', id: string): void;
}>();

const startPosition = computed(() => {
  return (props.element.timeFrame.start / props.maxTime) * 100;
});

const endPosition = computed(() => {
  return ((props.maxTime - props.element.timeFrame.end) / props.maxTime) * 100;
});

const width = computed(() => {
  return ((props.element.timeFrame.end - props.element.timeFrame.start) / props.maxTime) * 100;
});

const isActive = computed(() => {
  return props.currentTime >= props.element.timeFrame.start && props.currentTime <= props.element.timeFrame.end;
});

function handleDelete() {
  emit('delete', props.element.id);
}

function getParentTimelineContainer(element: HTMLElement | null): HTMLElement | null {
  if (!element) return null;
  if (element.classList.contains('timeline-container')) return element;
  return getParentTimelineContainer(element.parentElement);
}

function startDragOperation(startFn: (e: MouseEvent) => void) {
  const moveHandler = (e: MouseEvent) => {
    startFn(e);
  };
  
  const upHandler = () => {
    document.removeEventListener('mousemove', moveHandler);
    document.removeEventListener('mouseup', upHandler);
  };
  
  document.addEventListener('mousemove', moveHandler);
  document.addEventListener('mouseup', upHandler);
}

function handleStartDrag(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement;
  const container = getParentTimelineContainer(target);
  if (!container) return;
  
  startDragOperation((e: MouseEvent) => {
    const { left, width: containerWidth } = container.getBoundingClientRect();
    const offsetRatio = (e.clientX - left) / containerWidth;
    const newStart = offsetRatio * props.maxTime * props.scaleTimelineZoom;
    
    if (newStart >= 0 && newStart < props.element.timeFrame.end) {
      emit('onUpdateTimeFrame', props.element, {
        start: newStart,
        end: props.element.timeFrame.end,
      });
    }
  });
}

function handleEndDrag(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement;
  const container = getParentTimelineContainer(target);
  if (!container) return;
  
  startDragOperation((e: MouseEvent) => {
    const { left, width: containerWidth } = container.getBoundingClientRect();
    const offsetRatio = (e.clientX - left) / containerWidth;
    const newEnd = offsetRatio * props.maxTime * props.scaleTimelineZoom;
    
    if (newEnd > props.element.timeFrame.start && newEnd <= props.maxTime) {
      emit('onUpdateTimeFrame', props.element, {
        start: props.element.timeFrame.start,
        end: newEnd,
      });
    }
  });
}

function handleMove(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement;
  const container = getParentTimelineContainer(target);
  if (!container) return;
  
  const initialX = event.clientX;
  const initialStart = props.element.timeFrame.start;
  const initialEnd = props.element.timeFrame.end;
  const duration = initialEnd - initialStart;
  
  startDragOperation((e: MouseEvent) => {
    const { left, width: containerWidth } = container.getBoundingClientRect();
    const deltaX = e.clientX - initialX;
    const deltaTime = (deltaX / containerWidth) * props.maxTime * props.scaleTimelineZoom;
    
    let newStart = initialStart + deltaTime;
    let newEnd = initialEnd + deltaTime;
    
    // Ensure we don't go out of bounds
    if (newStart < 0) {
      const offset = -newStart;
      newStart = 0;
      newEnd = initialEnd - initialStart;
    }
    
    if (newEnd > props.maxTime) {
      const offset = newEnd - props.maxTime;
      newEnd = props.maxTime;
      newStart = newEnd - duration;
    }
    
    emit('onUpdateTimeFrame', props.element, {
      start: newStart,
      end: newEnd,
    });
  });
}
</script>

<template>
  <div 
    class="timeline-container h-[30px] rounded-md mb-1 relative"
    :style="{ 
      backgroundColor: 'rgb(71 85 105)', 
    }"
  >
    <div 
      class="w-full h-full mb-1 absolute left-0 rounded overflow-hidden"
    >
      <div 
        class="h-full rounded-md flex justify-between items-center px-1"
        :class="{
          'bg-blue-600': isActive,
          'bg-blue-400': !isActive,
        }"
        :style="{ 
          marginLeft: startPosition + '%', 
          width: width + '%', 
        }"
      >
        <div 
          class="w-2 h-full cursor-ew-resize opacity-60 hover:opacity-100 bg-blue-700 hover:bg-blue-600"
          @mousedown="handleStartDrag"
        ></div>
        
        <div 
          class="flex-1 h-full cursor-move flex items-center justify-center text-white text-xs truncate"
          @mousedown="handleMove"
        >
          {{ props.element.name }}
        </div>
        
        <div 
          class="w-2 h-full cursor-ew-resize opacity-60 hover:opacity-100 bg-blue-700 hover:bg-blue-600"
          @mousedown="handleEndDrag"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add your styles here */
</style>