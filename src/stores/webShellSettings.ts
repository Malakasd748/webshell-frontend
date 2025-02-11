import { computed, ref } from 'vue'
import type { ITheme } from '@xterm/xterm'
import { mapKeys, pick, startCase } from 'lodash-es'
import xtermThemes from 'xterm-theme'
import { defineStore } from 'pinia'

import { setShellConfig, getShellConfig } from '@/api/webshell'
import { useWebshellResourceStore } from './webShellResource'
import type { HpcResource } from '../hpcResource'

export const availableThemes: Record<string, ITheme> = pick(
  mapKeys(xtermThemes, (_value, key) => startCase(key)),
  ['Argonaut', 'Atom', 'Homebrew', 'Solarized Dark', 'Ayu', 'Dracula'],
)

// TODO: 与资源无关
export const useWebshellSettingsStore = defineStore('webshell-settings', () => {
  const resourceStore = useWebshellResourceStore()

  const themeName = ref('Atom')
  const fontSize = ref(14)

  const theme = computed(() => availableThemes[themeName.value])

  async function syncConfig(r: HpcResource) {
    const { data } = await getShellConfig({
      resource_type: 'hpc',
      resource_id: r.id,
    })

    if (data.success !== 'yes') {
      return
    }

    themeName.value = data.webterm_config.theme
    fontSize.value = Number(data.webterm_config.fontsize)
  }

  function setConfig(config: { themeName?: string, fontSize?: number }) {
    if (config.themeName) {
      themeName.value = config.themeName
    }
    if (config.fontSize) {
      fontSize.value = config.fontSize
    }
    resourceStore.resources.forEach(r =>
      setShellConfig({
        resource_type: 'hpc',
        resource_id: r.id,
        theme: config.themeName,
        fontSize: config.fontSize === undefined ? undefined : String(config.fontSize),
      }),
    )
  }

  return {
    themeName,
    fontSize,
    theme,

    syncConfig,
    setConfig,
  }
})
