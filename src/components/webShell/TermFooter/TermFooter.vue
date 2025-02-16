<template>
  <div class="flex-(~ items-center) px-5 py-2">
    <div
      v-if="latency !== undefined"
      class="text-xs font-400"
    >
      会话延迟：{{ latency }}ms
    </div>

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
  import { ref, watch, computed } from 'vue'
  import { NPopover, NButton } from 'naive-ui'
  import { storeToRefs } from 'pinia'

  import UploadList from '../UploadList'
  import { useWebShellUploadStore } from '@/stores/webShellUpload'
  import { useWebShellTermStore } from '@/stores/webShellTerm'
  import { TermManagerRegistry } from '@/services/termManagerRegistry'

  const webshellUploadStore = useWebShellUploadStore()
  const webshellTermStore = useWebShellTermStore()

  const latency = computed(() => TermManagerRegistry.getManager(webshellTermStore.lastFocusedTerm?.id)?.latency)

  const showUploadList = ref(false)
  function toggleUploadList() {
    showUploadList.value = !showUploadList.value
  }

  const { sessions: uploadSessions } = storeToRefs(webshellUploadStore)
  watch(
    () => uploadSessions.value.length,
    (newlen, oldlen) => {
      console.log(newlen, oldlen)
      if (newlen > oldlen) {
        showUploadList.value = true
      }
    },
  )
</script>

<style scoped></style>
