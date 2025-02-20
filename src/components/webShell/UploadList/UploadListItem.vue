<template>
  <NListItem
    ref="item-root"
    class="text-12px"
  >
    <NGrid>
      <NGi
        :span="16"
        class="flex-(~ gap-2 items-center)"
      >
        <div
          :class="
            session.type === 'file' ? 'i-ant-design:file-filled' : 'i-ant-design:folder-filled'
          "
          class="size-6"
        ></div>

        <div class="flex-(~ col) max-w-54">
          <NEllipsis
            :style="{ color: textColorBase }"
            :tooltip="{ contentClass: 'w-max' }"
          >
            {{ session.name }}
          </NEllipsis>
          <div :style="{ color: textColorDisabled }">
            <template v-if="showSizeProgress">
              {{ getSize(session.doneSize) }} / {{ getSize(session.doneSize) }}
            </template>
            <NDivider
              v-if="showSizeProgress && showCountProgress"
              vertical
              :style="{ backgroundColor: textColorDisabled }"
            />
            <template v-if="showCountProgress">
              {{ session.doneFilesCount }} / {{ session.totalFilesCount }}
            </template>
          </div>
        </div>
      </NGi>

      <NGi
        :span="4"
        class="flex-(~ gap-2 items-center)"
      >
        <span
          :style="{ backgroundColor: itemMap[session.status!][0] }"
          class="size-6px rounded-full inline-block"
        ></span>
        <span>{{ itemMap[session.status!][1] }}</span>
      </NGi>

      <NGi
        :span="4"
        class="flex-(~ gap-2 items-center justify-end)"
      >
        <NTooltip
          v-if="removableStatuses.includes(session.status!)"
          content-class="w-max"
        >
          清除
          <template #trigger>
            <NButton
              quaternary
              size="tiny"
              @click="emit('remove', session)"
            >
              <span class="i-ant-design:delete-outlined"></span>
            </NButton>
          </template>
        </NTooltip>
        <NTooltip
          v-if="redoableStatuses.includes(session.status!)"
          content-class="w-max"
        >
          重传
          <template #trigger>
            <NButton
              quaternary
              size="tiny"
              @click="emit('redo', session)"
            >
              <span class="i-ant-design:redo-outlined"></span>
            </NButton>
          </template>
        </NTooltip>

        <NTooltip
          v-if="
            cancelableStatuses.includes(session.status!) ||
              (session.status === 'uploading' && hovered)
          "
          content-class="w-max"
        >
          取消
          <template #trigger>
            <NButton
              quaternary
              size="tiny"
              @click="emit('cancel', session)"
            >
              <span class="i-ant-design:close-outlined"></span>
            </NButton>
          </template>
        </NTooltip>

        <div
          v-if="session.status === 'uploading' && !hovered"
          class="flex items-center"
        >
          <img
            :src="SpinnerImg"
            class="spinner ml-2 size-14px object-contain"
          />
        </div>
      </NGi>
    </NGrid>

    <template v-if="showUploadingFile || showDestination">
      <NEllipsis
        class="max-w-56! ml-8"
        :style="{ color: textColorDisabled }"
        :tooltip="{ contentClass: 'w-max' }"
      >
        <template v-if="showUploadingFile">
          {{ session.currentFileRelativePath }}
        </template>
        <template v-else-if="showDestination">
          {{ session.path }}
        </template>
      </NEllipsis>
    </template>
  </NListItem>
</template>

<script setup lang="ts">
  import { ref, toRefs, computed, useTemplateRef } from 'vue'
  import {
    NListItem,
    NGrid,
    NGi,
    useThemeVars,
    NEllipsis,
    NDivider,
    NTooltip,
    NButton,
  } from 'naive-ui'
  import { useEventListener } from '@vueuse/core'

  import type { UploadSession, SessionStatus } from '@/services/websocketBase/uploadService'
  import SpinnerImg from '#assets/images/webshell/spinner.png'

  const { session } = defineProps<{ session: UploadSession }>()
  const emit = defineEmits<{
    (e: 'remove', session: UploadSession): void
    (e: 'cancel', session: UploadSession): void
    (e: 'redo', session: UploadSession): void
  }>()

  type UploadListItemMap = Record<NonNullable<SessionStatus>, [string, string]>
  const itemMap: UploadListItemMap = {
    completed: ['rgba(82, 196, 26, 1)', '已完成'],
    uploading: ['rgba(24, 144, 255, 1)', '传输中'],
    pending: ['rgba(250, 173, 20, 1)', '排队中'],
    preparing: ['rgba(250, 219, 20, 1)', '准备中'],
    cancelled: ['rgba(217, 217, 217, 1)', '已取消'],
    error: ['rgba(255, 77, 79, 1)', '上传失败'],
  }

  const { textColorBase, textColorDisabled } = toRefs(useThemeVars().value)

  const showSizeProgress = computed(() => session.status !== 'preparing' && session.totalSize > 0)
  const showCountProgress = computed(
    () =>
      session.type === 'directory'
      && (session.totalFilesCount - session.doneFilesCount > 0 || session.doneFilesCount > 0),
  )
  const showUploadingFile = computed(
    () => session.type === 'directory' && session.status === 'uploading',
  )
  const showDestination = computed(() => session.status === 'completed')

  const cancelableStatuses: readonly SessionStatus[] = ['pending', 'preparing']
  const redoableStatuses: readonly SessionStatus[] = ['error', 'cancelled']
  const removableStatuses: readonly SessionStatus[] = ['completed', 'error', 'cancelled']

  function getSize(size: number) {
    const units = ['B', 'KB', 'MB', 'GB']
    let carry = 0
    while (size >= 1024) {
      size /= 1024
      carry++
    }
    return `${size.toFixed(2)} ${units[carry]}`
  }

  const hovered = ref(false)

  const itemRoot = useTemplateRef('item-root')
  useEventListener(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    () => itemRoot.value?.$el,
    'mouseenter',
    () => (hovered.value = true),
  )
  useEventListener(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    () => itemRoot.value?.$el,
    'mouseleave',
    () => (hovered.value = false),
  )
</script>

<style scoped>
  .spinner {
    animation: rotator 0.6s linear infinite;
  }

  @keyframes rotator {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }
</style>
