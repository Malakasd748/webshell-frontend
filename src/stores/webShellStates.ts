import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useWebShellStateStore = defineStore('webshell-state', () => {
  const isFullscreen = ref(false)

  return {
    isFullscreen,
  }
})
