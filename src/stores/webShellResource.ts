import { ref, computed } from 'vue'
import { useAsyncState } from '@vueuse/core'
import { defineStore } from 'pinia'

import { LocalhostResource } from '@/models/resources/localhostResource'

export const useWebShellResourceStore = defineStore('webshell-resource', () => {
  const localhostResource = new LocalhostResource({ id: '123', name: 'localhost', port: 1234 })
  const fetchResources = useAsyncState<LocalhostResource[]>(
    async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return [localhostResource]
    },
    [],
    { immediate: false },
  )

  const selectedResourceId = ref<string>()
  const activeManager = computed(() => localhostResource.manager)

  return {
    resources: fetchResources.state,
    selectedResourceId,
    activeManager,
    fetchResources: () => fetchResources.execute(),
  }
})
