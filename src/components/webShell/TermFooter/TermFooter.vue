<template>
  <div class="flex-(~ items-center) px-5 py-2">
    <!-- <div class="text-xs font-400" v-if="webshellTermStore.lastFocusedTerm?.socket.latency">
      会话延迟：{{ webshellStore.lastFocusedTerm?.socket.latency }}ms
    </div> -->

    <NPopover
      trigger="click"
      :show-arrow="false"
      :show="showUploadList"
      placement="top-end"
      style="background-color: transparent; padding-right: 0"
    >
      <UploadList
        key="upload-list"
        dark
        class="w-450px max-h-430px absolute bottom-2 right-0"
        @hide-clicked="showUploadList = false"
      />
      <template #trigger>
        <NButton
          quaternary
          size="tiny"
          :focusable="false"
          class="ml-auto"
          @click="toggleUploadList"
        >
          <div class="i-ant-design:cloud-upload-outlined size-4 mr-1"></div>
          上传列表
        </NButton>
      </template>
    </NPopover>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { NPopover, NButton } from 'naive-ui'

  import UploadList from '../UploadList'
  import { useWebShellUploadStore } from '@/stores/webShellUpload'

  const webshellUploadStore = useWebShellUploadStore()

  // TODO: 延迟

  const showUploadList = ref(false)
  function toggleUploadList() {
    showUploadList.value = !showUploadList.value
  }

  const uploadSessions = webshellUploadStore.sessions
  watch(
    () => uploadSessions.length,
    (newlen, oldlen) => {
      if (newlen > oldlen) {
        showUploadList.value = true
      }
    },
  )
</script>

<style scoped></style>
