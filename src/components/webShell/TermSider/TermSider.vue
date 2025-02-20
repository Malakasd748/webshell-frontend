<template>
  <NLayout
    class="h-full"
    style="background-color: var(--ws-panel-background-color)"
  >
    <NLayoutHeader
      bordered
      class="flex-(~ items-center) p-2 h-9"
      style="background-color: inherit"
    >
      <NButton
        quaternary
        :focusable="false"
        size="tiny"
        @click="collapsed = true"
      >
        <div class="i-ant-design:menu-fold-outlined size-4"></div>
      </NButton>

      <div class="text-base font-semibold ml-2">
        文件树
      </div>

      <NTooltip>
        <template v-if="showHiddenFiles">
          显示隐藏文件
        </template>
        <template v-else>
          不显示隐藏文件
        </template>
        <template #trigger>
          <NSwitch
            v-model:value="showHiddenFiles"
            class="ml-auto"
            size="small"
            :rubber-band="false"
            :theme-overrides="{railColorActive: 'var(--primary-color)' }"
          />
        </template>
      </NTooltip>

      <NTooltip>
        刷新
        <template #trigger>
          <NButton
            quaternary
            :focusable="false"
            size="tiny"
            class="ml-2"
            @click="fileTreeRef?.refresh()"
          >
            <div class="i-ant-design:redo-outlined size-4"></div>
          </NButton>
        </template>
      </NTooltip>
    </NLayoutHeader>

    <FileTree
      ref="fileTreeRef"
      :manager="manager"
      :show-hidden-files="showHiddenFiles"
      class="contain-strict w-full"
    />
  </NLayout>
</template>

<script setup lang="ts">
  import { NButton, NLayout, NLayoutHeader, NSwitch, NTooltip } from 'naive-ui'
  import { ref } from 'vue'

  import type { WebShellWSManager } from '@/services/webshell/webShellWSManager'
  import FileTree from './FileTree'

  const { manager } = defineProps<{
    manager: WebShellWSManager
  }>()
  const collapsed = defineModel<boolean>('collapsed', { required: true })

  const showHiddenFiles = ref(false)

  const fileTreeRef = ref<InstanceType<typeof FileTree>>()
</script>

<style scoped></style>
