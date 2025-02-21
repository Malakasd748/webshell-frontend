import { shallowRef, watchEffect } from 'vue'
import { useEventListener } from '@vueuse/core'
import { defineStore } from 'pinia'

import { Term } from '../xterm'
import { WebShellResource } from '@/models/resources/webshellResource'
import { WebShellWSManager } from '@/service/webshell/webShellWSManager'
import { useWebShellResourceStore } from './webshellResource'
import { useWebShellSettingStore } from './webshellSettings'

export const useWebShellTermStore = defineStore('webshell-term', () => {
  const resourceStore = useWebShellResourceStore()
  const settingStore = useWebShellSettingStore()

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
    resourceOrId: string | WebShellResource | undefined = resourceStore.selectedResource,
  ) {
    if (resourceOrId === undefined) {
      throw new Error('No resource selected')
    }

    const resource
      = resourceOrId instanceof WebShellResource
        ? resourceOrId
        : resourceStore.resources.find(r => r.id === resourceOrId)
    if (resource === undefined) {
      throw new Error('invalid resource id')
    }

    let manager = resource.manager
    if (!manager) {
      const wsUrl = await resource.getWsUrl()
      manager = new WebShellWSManager(wsUrl, resource)
    }

    const term = new Term()
    manager.ptyService.addTerm(term)

    watchEffect(() => {
      term.options.theme = settingStore.theme
    })
    watchEffect(() => {
      term.options.fontSize = settingStore.fontSize
    })

    terms.value.push(term)
  }

  function removeTerm(term: Term): void
  function removeTerm(index: number): void
  function removeTerm(arg: Term | number): void {
    let index: number
    let termToDispose: Term
    if (typeof arg === 'number') {
      index = arg
      if (index < 0 || index >= terms.value.length) {
        return
      }
      termToDispose = terms.value[index]
    } else {
      index = terms.value.indexOf(arg)
      if (index === -1) {
        return
      }
      termToDispose = arg
    }

    terms.value.splice(index, 1)
    termToDispose.dispose()
  }

  return {
    terms,
    lastFocusedTerm,

    addTerm,
    removeTerm,
  }
})
