<template>
  <NConfigProvider
    :theme="dark ? darkTheme : null"
    abstract
  >
    <div
      class="flex-(~ col)"
      style="
        background-color: #434343;
        box-shadow: 0px 3px 6px -4px rgba(0, 0, 0, 0.12), 0px 6px 16px rgba(0, 0, 0, 0.08),
          0px 9px 28px 8px rgba(0, 0, 0, 0.05);
      "
      v-bind="$attrs"
    >
      <div
        class="flex-(~ items-center gap-1) px-4 py-2.5"
        style="border-bottom: 1px solid rgba(88, 88, 94, 1)"
      >
        上传列表{{ sessions.length ? '' : '：没有上传任务' }}

        <NTooltip content-class="w-max">
          清空
          <template #trigger>
            <NButton
              class="ml-auto"
              quaternary
              size="tiny"
              :disabled="!sessions.length"
              :focusable="false"
              @click="uploadStore.clearIdleSessions()"
            >
              <div class="i-ant-design:clear-outlined size-3.5"></div>
            </NButton>
          </template>
        </NTooltip>

        <NTooltip content-class="w-max">
          收起
          <template #trigger>
            <NButton
              quaternary
              size="tiny"
              :focusable="false"
              @click="emit('hide-clicked')"
            >
              <div class="i-ant-design:down-outlined size-3.5"></div>
            </NButton>
          </template>
        </NTooltip>
      </div>

      <NList
        hoverable
        show-divider
        class="overflow-auto"
        style="background-color: #434343"
      >
        <UploadListItem
          v-for="(s, i) in <UploadSession[]>sessions"
          :key="i"
          :session="s"
          @redo="s.redo()"
          @cancel="s.cancel()"
          @remove="sessions.splice(i, 1)"
        />
      </NList>
    </div>
  </NConfigProvider>
</template>

<script setup lang="ts">
  import { NList, NConfigProvider, darkTheme, NTooltip, NButton } from 'naive-ui'
  import { storeToRefs } from 'pinia'

  import UploadListItem from './UploadListItem.vue'
  import { useWebShellUploadStore } from '@/stores/webShellUpload'
  import type { UploadSession } from '@/services/webSocketBase/uploadService'

  defineOptions({ inheritAttrs: false })

  const uploadStore = useWebShellUploadStore()

  const { dark = false } = defineProps<{ dark?: boolean }>()
  const emit = defineEmits<{
    (e: 'hide-clicked'): void
  }>()

  const { sessions } = storeToRefs(uploadStore)
</script>

<style scoped></style>
