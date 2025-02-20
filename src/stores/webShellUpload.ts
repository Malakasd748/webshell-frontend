import { ref } from 'vue'
import { defineStore } from 'pinia'

import type { UploadSession, SessionStatus } from '../services/websocketBase/uploadService'

export const useWebShellUploadStore = defineStore('webshell-upload', () => {
  const sessions = ref<UploadSession[]>([])

  const keepStatuses: SessionStatus[] = ['preparing', 'pending', 'uploading']

  function clearIdleSessions() {
    sessions.value = sessions.value.filter(s => keepStatuses.includes(s.status))
  }

  return {
    sessions,
    clearIdleSessions,
  }
})
