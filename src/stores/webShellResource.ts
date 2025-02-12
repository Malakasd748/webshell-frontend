import { ref } from 'vue'
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

  const selectedResource = ref<LocalhostResource>()

  function selectResourceById(id: string) {
    const resource = fetchResources.state.value.find(r => r.id === id)
    if (resource) {
      selectedResource.value = resource
      return true
    }
    return false
  }

  return {
    resources: fetchResources.state,
    selectedResource,

    selectResourceById,
    fetchResources: () => fetchResources.execute(),
  }
})
