<template>
  <div
    class="outline-(.5px solid #4b4b4b) rounded-1 cursor-pointer relative"
    ref="card-container"
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

    <div class="rounded-1 w-112 h-34" ref="terminal-container"></div>

    <template v-if="checked">
      <div
        class="absolute bottom-0 right-0 size-0 border-r-(28px color-primary) border-t-(28px transparent)"
      >
      </div>
      <div
        class="i-ant-design:check-outlined color-white bottom-0.5 right-0.5 absolute size-3"
      ></div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { ref, useTemplateRef, onMounted, computed, watch } from 'vue';
  import { Terminal } from '@xterm/xterm';
  import { FitAddon } from '@xterm/addon-fit';
  import { useElementHover } from '@vueuse/core';

  import { availableThemes } from '../stores/settings';
  import { useWebshellSettingsStore } from '../stores/settings';

  const { themeName } = defineProps<{ themeName: string }>();

  const settingsStore = useWebshellSettingsStore();

  const terminalContainer = useTemplateRef('terminal-container');
  const cardContainer = useTemplateRef('card-container');
  const cardHovered = useElementHover(cardContainer);

  const checked = computed(() => settingsStore.themeName === themeName);

  const theme = availableThemes[themeName];

  onMounted(() => {
    const t = new Terminal({
      theme,
      rows: 6,
      cols: 44,
      disableStdin: true,
    });
    t.open(terminalContainer.value!);
    t.write(`\x1b]0;user@cn1:~\x07[user@cn1 ~]$ ll\r
drwx------ 4 user  \x1b[0m\x1b[01;34m.\x1b[0m\r
drwxr-xr-x 3 root  \x1b[01;34m..\x1b[0m\r
-rw------- 1 user  .bashrc\r
drwx------ 2 user  \x1b[01;34m.ssh\x1b[0m\r
drwxr-xr-x 2 user  \x1b[01;34m.trash\x1b[0m\r`);

    t.element!.style.padding = '12px 16px';

    const fitAddon = new FitAddon();
    t.loadAddon(fitAddon);

    watch(
      () => settingsStore.fontSize,
      (fontSize) => {
        t.options = { fontSize };
        fitAddon.fit();
      },
      { immediate: true },
    );
  });
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
