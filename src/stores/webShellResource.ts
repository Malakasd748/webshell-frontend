import { ref } from 'vue'
import { useAsyncState } from '@vueuse/core'
import { defineStore } from 'pinia'

import { LocalhostResource } from '@/models/resources/localhostResource'
import { SSHResource } from '@/models/resources/sshResource'
import type { WebShellResource } from '@/models/resources/webshellResource'

export const useWebShellResourceStore = defineStore('webshell-resource', () => {
  const localhostResource = new LocalhostResource({ id: '123', name: 'localhost', port: 1234 })
  const sshResource = new SSHResource({
    id: 'ssh',
    name: 'ssh',
    host: 'localhost',
    port: 22,
    username: 'vicii',
    password: import.meta.env.VITE_SSH_PASSWORD,
  })

  const fetchResources = useAsyncState<WebShellResource[]>(
    async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return [localhostResource, sshResource]
    },
    [],
    { immediate: false },
  )

  const selectedResource = ref<WebShellResource>()

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
