<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';
import { fabric } from 'fabric';
import { useEditorStore } from '@/store';
import Resources from './Resources.vue';
import ElementsPanel from './panels/ElementsPanel.vue';
import Menu from './Menu.vue';
import TimeLine from './TimeLine.vue';
import '@/utils/fabric-utils';

const store = useEditorStore();

onMounted(() => {
  // Give the DOM time to render first
  setTimeout(() => {
    console.log("Initializing Fabric canvas");
    
    // Initialize canvas with higher resolution for better video quality
    const canvas = new fabric.Canvas("canvas", {
      height: 500,
      width: 800,
      backgroundColor: "#333333",
      preserveObjectStacking: true, // Important for correct z-index
      imageSmoothingEnabled: true,
      enableRetinaScaling: true,
      stopContextMenu: true, // Prevent right-click menu
    });
    
    // Setup fabric object styling
    fabric.Object.prototype.transparentCorners = false;
    fabric.Object.prototype.cornerColor = "#00a0f5";
    fabric.Object.prototype.cornerStyle = "circle";
    fabric.Object.prototype.cornerStrokeColor = "#0063d8";
    fabric.Object.prototype.cornerSize = 10;
    fabric.Object.prototype.padding = 5;
    
    // Canvas event handlers
    canvas.on("mouse:down", function (e) {
      if (!e.target) {
        store.setSelectedElement(null);
      }
    });
    
    // Enable object selection
    canvas.selection = true;
    
    // Store the canvas in our state
    store.setCanvas(canvas);
    
    // Setup continuous rendering
    fabric.util.requestAnimFrame(function render() {
      canvas.renderAll();
      fabric.util.requestAnimFrame(render);
    });
    
    console.log("Canvas initialized with dimensions:", canvas.width, "x", canvas.height);
  }, 100); // Wait 100ms to ensure DOM is ready
});

onUnmounted(() => {
  // Cancel any animation frames
  if (typeof cancelAnimationFrame === 'function') {
    const highestId = requestAnimationFrame(() => {});
    for (let i = 0; i < highestId; i++) {
      cancelAnimationFrame(i);
    }
  }
  
  // Clean up all media elements
  store.editorElements.forEach(element => {
    if (element.type === 'video' || element.type === 'audio') {
      const mediaElement = document.getElementById(element.properties.elementId);
      if (mediaElement) {
        if ((element.type === 'video' && isHtmlVideoElement(mediaElement)) || 
            (element.type === 'audio' && isHtmlAudioElement(mediaElement))) {
          mediaElement.pause();
          mediaElement.src = '';
          try { mediaElement.load(); } catch (e) {}
          mediaElement.remove();
        }
      }
    }
  });
  
  // Dispose of the canvas
  if (store.canvas) {
    store.canvas.dispose();
    store.setCanvas(null);
  }
  
  console.log("Editor component unmounted and resources cleaned up");
});
</script>

<template>
  <div class="grid grid-rows-[500px_1fr_20px] grid-cols-[72px_300px_1fr_250px] h-[100vh]">
    <div class="tile row-span-2 flex flex-col">
      <Menu />
    </div>
    <div class="row-span-2 flex flex-col overflow-scroll">
      <Resources />
    </div>
    <div id="grid-canvas-container" class="col-start-3 bg-slate-100 flex justify-center items-center">
      <canvas id="canvas" class="h-[500px] w-[800px] row" />
    </div>
    <div class="col-start-4 row-start-1">
      <ElementsPanel />
    </div>
    <div class="col-start-3 row-start-2 col-span-2 relative px-[10px] py-[4px] overflow-scroll">
      <TimeLine />
    </div>
    <div class="col-span-4 text-right px-2 text-[0.5em] bg-black text-white">
      Crafted By Amit Digga
    </div>
  </div>
</template>

<style scoped>
/* Add your custom styles here */
</style>