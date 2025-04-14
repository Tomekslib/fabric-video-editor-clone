<script setup lang="ts">
import { computed } from 'vue';
import { useEditorStore } from '@/store';
import VideoResourcesPanel from './panels/VideoResourcesPanel.vue';
import AudioResourcesPanel from './panels/AudioResourcesPanel.vue';
import TextResourcesPanel from './panels/TextResourcesPanel.vue';
import ImageResourcesPanel from './panels/ImageResourcesPanel.vue';
import EffectsPanel from './panels/EffectsPanel.vue';
import AnimationsPanel from './panels/AnimationsPanel.vue';
import ExportVideoPanel from './panels/ExportVideoPanel.vue';
import FillPanel from './panels/FillPanel.vue';

const store = useEditorStore();

const renderedPanel = computed(() => {
  switch (store.selectedMenuOption) {
    case 'Video':
      return VideoResourcesPanel;
    case 'Audio':
      return AudioResourcesPanel;
    case 'Text':
      return TextResourcesPanel;
    case 'Image':
      return ImageResourcesPanel;
    case 'Effect':
      return EffectsPanel;
    case 'Animation':
      return AnimationsPanel;
    case 'Export':
      return ExportVideoPanel;
    case 'Fill':
      return FillPanel;
    default:
      return null;
  }
});
</script>

<template>
  <div class="h-full bg-slate-800 text-white">
    <component :is="renderedPanel" />
  </div>
</template>

<style scoped>
/* Add your styles here */
</style>