import { computed, ref } from 'vue'
import type { ITheme } from '@xterm/xterm'
import { mapKeys, pick, startCase } from 'lodash-es'
import xtermThemes from 'xterm-theme'
import { defineStore } from 'pinia'

export const availableThemes: Record<string, ITheme> = pick(
  mapKeys(xtermThemes, (_value, key) => startCase(key)),
  ['Argonaut', 'Atom', 'Homebrew', 'Solarized Dark', 'Ayu', 'Dracula'],
)

export const useWebShellSettingsStore = defineStore('webshell-settings', () => {
  const themeName = ref('Atom')
  const fontSize = ref(14)

  const theme = computed(() => availableThemes[themeName.value])

  // TODO
  function syncConfig() {
    return
  }

  // TODO
  function setConfig(config: { themeName?: string, fontSize?: number }) {
    if (config.themeName) {
      themeName.value = config.themeName
    }
    if (config.fontSize) {
      fontSize.value = config.fontSize
    }
  }

  return {
    themeName,
    fontSize,
    theme,

    syncConfig,
    setConfig,
  }
})
