import { shallowRef, shallowReactive } from 'vue'
import { defineStore } from 'pinia'

import type { WebShellResource } from '@/models/resources/webshellResource'

export const useWebShellResourceStore = defineStore('webshell-resource', () => {
  const resources = shallowRef<WebShellResource[]>(shallowReactive([]))

  const selectedResource = shallowRef<WebShellResource>()

  function selectResource(resource: WebShellResource): void
  function selectResource(name: string): void
  function selectResource(resourceOrName: WebShellResource | string) {
    if (typeof resourceOrName === 'string') {
      selectedResource.value = resources.value.find(r => r.name === resourceOrName)
    } else {
      selectedResource.value = resourceOrName
    }
  }

  function addResource(resource: WebShellResource) {
    if (resources.value.some(r => r.name === resource.name)) {
      throw new Error(`资源名称 "${resource.name}" 已存在`)
    }
    resources.value.push(resource)
  }

  return {
    resources,
    selectedResource,

    selectResource,
    addResource,
  }
})
