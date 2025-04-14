<script setup lang="ts">
import type { MenuOption } from '@/types';
import { useEditorStore } from '@/store';

const store = useEditorStore();

const menuItems: { title: MenuOption; icon: string }[] = [
  {
    title: "Video",
    icon: "📹",
  },
  {
    title: "Audio",
    icon: "🔊",
  },
  {
    title: "Text",
    icon: "🔤",
  },
  {
    title: "Image",
    icon: "🖼️",
  },
  {
    title: "Export",
    icon: "⬇️",
  },
  {
    title: "Animation",
    icon: "🎬",
  },
  {
    title: "Effect",
    icon: "✨",
  },
  {
    title: "Fill",
    icon: "🎨",
  },
];
</script>

<template>
  <div class="flex flex-col gap-2 p-2 bg-slate-700 h-full text-white">
    <div 
      v-for="item in menuItems" 
      :key="item.title"
      class="flex flex-col items-center justify-center cursor-pointer p-2 rounded-lg hover:bg-slate-600 transition-all"
      :class="{
        'bg-slate-600': store.selectedMenuOption === item.title,
      }"
      @click="store.setSelectedMenuOption(item.title)"
    >
      <div class="text-2xl">{{ item.icon }}</div>
      <div class="text-xs">{{ item.title }}</div>
    </div>
  </div>
</template>

<style scoped>
/* Add your custom styles here */
</style>