import { shallowRef } from 'vue'
import { useEventListener } from '@vueuse/core'
import { defineStore } from 'pinia'

import { Term } from '../xterm'
import { useWebshellResourceStore } from './webShellResource'
import { WebshellResource } from '../webshellResource'
import { WebshellWSManager } from '../services/webshellWSManager'

export const useWebshellTermStore = defineStore('webshell-term', () => {
  const resourceStore = useWebshellResourceStore()

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
  function addTerm(resource: WebshellResource): Promise<void>
  async function addTerm(
    resourceOrId: string | WebshellResource | undefined = resourceStore.activeManager?.resource,
  ) {
    if (!resourceOrId) {
      throw new Error('No resource selected')
    }

    const resource
      = resourceOrId instanceof WebshellResource
        ? resourceOrId
        : (resourceStore.resources.find(r => r.id === resourceOrId) as WebshellResource)
    if (!resource) {
      throw new Error('invalid resource id')
    }

    const wsUrl = await resource.getWsUrl()
    const manager = new WebshellWSManager(wsUrl, resource)

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
