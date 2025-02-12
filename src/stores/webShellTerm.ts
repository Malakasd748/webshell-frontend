import { shallowRef } from 'vue'
import { useEventListener } from '@vueuse/core'
import { defineStore } from 'pinia'

import { Term } from '../xterm'
import { useWebShellResourceStore } from './webShellResource'
import { WebShellResource } from '@/models/resources/webShellResource'
import { WebShellWSManager } from '@/services/webShell/webShellWSManager'

export const useWebshellTermStore = defineStore('webshell-term', () => {
  const resourceStore = useWebShellResourceStore()

  const terms = shallowRef<Term[]>([])
  const lastFocusedTerm = shallowRef<Term>()

  Term.registerNewTermCallback((term) => {
    useEventListener(
      () => term.container,
      'focusin',
      () => {
        lastFocusedTerm.value = term
      },
    )
  })

  function addTerm(): Promise<void>
  function addTerm(resourceId: string): Promise<void>
  function addTerm(resource: WebShellResource): Promise<void>
  async function addTerm(
    resourceOrId: string | WebShellResource | undefined = resourceStore.activeManager?.resource,
  ) {
    if (!resourceOrId) {
      throw new Error('No resource selected')
    }

    const resource
      = resourceOrId instanceof WebShellResource
        ? resourceOrId
        : resourceStore.resources.find(r => r.id === resourceOrId)
    if (resource === undefined) {
      throw new Error('invalid resource id')
    }

    const wsUrl = await resource.getWsUrl()
    const manager = new WebShellWSManager(wsUrl, resource)

    const term = Term.new()
    manager.ptyService.addTerm(term)

    terms.value.push(term)
  }

  return {
    terms,
    lastFocusedTerm,

    addTerm,
  }
})
