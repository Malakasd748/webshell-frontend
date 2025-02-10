<template>
  <NLayout class="h-full" style="background-color: var(--panel-background-color)">
    <NLayoutHeader bordered class="flex-(~ items-center) p-2 h-9" style="background-color: inherit">
      <NButton quaternary :focusable="false" size="tiny" @click="collapsed = true">
        <div class="i-ant-design:menu-fold-outlined size-4"></div>
      </NButton>

      <div class="text-base font-semibold ml-2"> 文件树 </div>

      <NTooltip>
        <template v-if="showHiddenFiles"> 显示隐藏文件 </template>
        <template v-else> 不显示隐藏文件 </template>
        <template #trigger>
          <NSwitch
            class="ml-auto"
            v-model:value="showHiddenFiles"
            size="small"
            :rubber-band="false"
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
      :manager="manager"
      :show-hidden-files="showHiddenFiles"
      class="contain-strict w-full"
      ref="fileTreeRef"
    />
  </NLayout>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { NLayout, NLayoutHeader, NButton, NSwitch, NTooltip } from 'naive-ui';

  import FileTree from './FileTree';
  import type { WebshellWSManager } from '../services/webshellWSManager';

  const { manager } = defineProps<{
    manager: WebshellWSManager;
  }>();
  const collapsed = defineModel<boolean>('collapsed', { required: true });

  const showHiddenFiles = ref(false);

  const fileTreeRef = ref<InstanceType<typeof FileTree>>();
</script>

<style scoped></style>
