<script setup lang="ts">
const props = defineProps<{
  accept?: string;
  label?: string;
  multiple?: boolean;
}>();

const emit = defineEmits<{
  (e: 'onUpload', files: File[]): void;
}>();

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const files = Array.from(input.files);
    emit('onUpload', files);
    // Reset the input so the same file can be uploaded again
    input.value = '';
  }
}
</script>

<template>
  <div>
    <label class="cursor-pointer flex justify-center items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded-md">
      <span>{{ label || 'Upload' }}</span>
      <input 
        type="file" 
        class="hidden" 
        :accept="accept" 
        :multiple="multiple" 
        @change="onFileChange"
      />
    </label>
  </div>
</template>

<style scoped>
/* Add your styles here */
</style>