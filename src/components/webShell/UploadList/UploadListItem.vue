<template>
  <NListItem
    ref="itemRoot"
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
        />

        <div class="flex-(~ col) max-w-54">
          <NEllipsis
            :style="{ color: textColorBase }"
            :tooltip="{ contentClass: 'w-max' }"
          >
            {{ session.name }}
          </NEllipsis>
          <div :style="{ color: textColorDisabled }">
            <template v-if="showSizeProgress">
              {{ getSize(session.doneSize.value) }} / {{ getSize(session.totalSize.value) }}
            </template>
            <NDivider
              v-if="showSizeProgress && showCountProgress"
              vertical
              :style="{ backgroundColor: textColorDisabled }"
            />
            <template v-if="showCountProgress">
              {{ session.doneFiles.size }} /
              {{ session.pendingFiles.size + session.doneFiles.size }}
            </template>
          </div>
        </div>
      </NGi>

      <NGi
        :span="4"
        class="flex-(~ gap-2 items-center)"
      >
        <span
          :style="{ backgroundColor: itemMap[session.status.value!][0] }"
          class="size-6px rounded-full inline-block"
        />
        <span>{{ itemMap[session.status.value!][1] }}</span>
      </NGi>

      <NGi
        :span="4"
        class="flex-(~ gap-2 items-center justify-end)"
      >
        <NTooltip
          v-if="removableStatuses.includes(session.status.value!)"
          content-class="w-max"
        >
          清除
          <template #trigger>
            <NButton
              quaternary
              size="tiny"
              @click="emit('remove', session)"
            >
              <span class="i-ant-design:delete-outlined" />
            </NButton>
          </template>
        </NTooltip>
        <NTooltip
          v-if="redoableStatuses.includes(session.status.value!)"
          content-class="w-max"
        >
          重传
          <template #trigger>
            <NButton
              quaternary
              size="tiny"
              @click="emit('redo', session)"
            >
              <span class="i-ant-design:redo-outlined" />
            </NButton>
          </template>
        </NTooltip>

        <NTooltip
          v-if="
            cancelableStatuses.includes(session.status.value!) ||
              (session.status.value === 'uploading' && hovered)
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
              <span class="i-ant-design:close-outlined" />
            </NButton>
          </template>
        </NTooltip>

        <div
          v-if="session.status.value === 'uploading' && !hovered"
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
          {{ uploadingFile?.relativePath }}
        </template>
        <template v-else-if="showDestination">
          {{ session.path }}
        </template>
      </NEllipsis>
    </template>
  </NListItem>
</template>

<script setup lang="ts">
import { ref, toRefs, toRef, computed, useTemplateRef } from 'vue'
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

import type { UploadSession, SessionStatus } from '../webshellSocket/uploadService'
import SpinnerImg from '@/assets/images/webshell/spinner.png'

const { session } = defineProps<{ session: UploadSession }>()
const emit = defineEmits<{
  (e: 'remove', session: UploadSession): void
  (e: 'cancel', session: UploadSession): void
  (e: 'redo', session: UploadSession): void
}>()

  type UploadListItemMap = Record<SessionStatus, [string, string]>
const itemMap: UploadListItemMap = {
  completed: ['rgba(82, 196, 26, 1)', '已完成'],
  uploading: ['rgba(24, 144, 255, 1)', '传输中'],
  pending: ['rgba(250, 173, 20, 1)', '排队中'],
  preparing: ['rgba(250, 219, 20, 1)', '准备中'],
  cancelled: ['rgba(217, 217, 217, 1)', '已取消'],
  error: ['rgba(255, 77, 79, 1)', '上传失败'],
}

const { textColorBase, textColorDisabled } = toRefs(useThemeVars().value)

const uploadingFile = toRef(() => session.pendingFiles.values().next().value)
const showSizeProgress = computed(
  () => session.status.value !== 'preparing' && session.totalSize.value > 0,
)
const showCountProgress = computed(
  () =>
    session.type === 'directory' && (session.pendingFiles.size > 0 || session.doneFiles.size > 0),
)
const showUploadingFile = computed(
  () => session.type === 'directory' && session.status.value === 'uploading',
)
const showDestination = computed(() => session.status.value === 'completed')

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

const itemRoot = useTemplateRef('itemRoot')
useEventListener(
  () => itemRoot.value?.$el,
  'mouseenter',
  () => (hovered.value = true),
)
useEventListener(
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
