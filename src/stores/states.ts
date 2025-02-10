import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useWebshellStateStore = defineStore('webshell-state', () => {
  const isFullscreen = ref(false);

  return {
    isFullscreen,
  };
});
