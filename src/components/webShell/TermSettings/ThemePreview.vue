<template>
  <div
    ref="card-container"
    class="outline-(.5px solid #4b4b4b) rounded-1 cursor-pointer relative"
    :style="{
      backgroundColor: theme.background,
      outlineColor: cardHovered || checked ? 'var(--color-primary)' : undefined,
      outlineWidth: cardHovered || checked ? '2px' : undefined,
    }"
    @click="settingsStore.setConfig({ themeName })"
  >
    <div
      class="px-4 py-2.5 rounded-t-1 border-b-(1 color-#4b4b4b)"
      :style="{ color: cardHovered || checked ? 'var(--color-primary)' : undefined }"
    >
      {{ themeName }}
    </div>

    <div
      ref="terminal-container"
      class="rounded-1 w-112 h-34"
    ></div>

    <template v-if="checked">
      <div
        class="absolute bottom-0 right-0 size-0 border-r-(28px color-primary) border-t-(28px transparent)"
      ></div>
      <div
        class="i-ant-design:check-outlined color-white bottom-0.5 right-0.5 absolute size-3"
      ></div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { useTemplateRef, onMounted, computed, watch } from 'vue'
  import { Terminal } from '@xterm/xterm'
  import { FitAddon } from '@xterm/addon-fit'
  import { useElementHover } from '@vueuse/core'

  import { availableThemes, useWebShellSettingsStore } from '@/stores/webShellSettings'

  const { themeName } = defineProps<{ themeName: string }>()

  const settingsStore = useWebShellSettingsStore()

  const terminalContainer = useTemplateRef('terminal-container')
  const cardContainer = useTemplateRef('card-container')
  const cardHovered = useElementHover(cardContainer)

  const checked = computed(() => settingsStore.themeName === themeName)

  const theme = availableThemes[themeName]

  const demoText = `\x1b[37mNormal Text \x1b[0m\x1b[1mBold\x1b[0m \x1b[3mItalic\x1b[0m
\x1b[31mRed \x1b[32mGreen \x1b[33mYellow \x1b[34mBlue\x1b[0m
\x1b[35mMagenta \x1b[36mCyan \x1b[37mWhite\x1b[0
\x1b[1m\x1b[31mBold Red\x1b[0m \x1b[1m\x1b[34mBold Blue\x1b[0m
[user@server ~]$ ls -l
\x1b[1;34mDocuments\x1b[0m  \x1b[1;32mscript.sh\x1b[0m  \x1b[1;31merror.log\x1b[0m`

  onMounted(() => {
    const t = new Terminal({
      theme,
      rows: 6,
      cols: 44,
      disableStdin: true,
    })
    t.open(terminalContainer.value as HTMLDivElement)
    t.write(demoText)

    t.element!.style.padding = '12px 16px'

    const fitAddon = new FitAddon()
    t.loadAddon(fitAddon)

    watch(
      () => settingsStore.fontSize,
      (fontSize) => {
        t.options = { fontSize }
        fitAddon.fit()
      },
      { immediate: true },
    )
  })
</script>

<style scoped>
  :deep(.xterm-viewport) {
    border-radius: 4px;
  }

  :deep(.xterm-helper-textarea) {
    display: none;
  }

  :deep(.xterm-screen) .xterm-rows .xterm-cursor.xterm-cursor-outline {
    outline: none;
  }
</style>
