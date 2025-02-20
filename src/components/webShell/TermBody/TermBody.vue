<template>
  <NSpin
    :show="loading"
    content-class="size-full"
  >
    <div
      :ref="el => el && term.open(el as HTMLElement)"
      class="contain-strict size-full"
      :style="{ backgroundColor: settingsStore.theme.background }"
    ></div>
  </NSpin>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { NSpin } from 'naive-ui'

  import type { Term } from '@/xterm'
  import { useWebShellSettingStore } from '@/stores/webshellSettings'
  import { TermManagerRegistry } from '@/services/termManagerRegistry'

  const settingsStore = useWebShellSettingStore()

  const { term } = defineProps<{
    term: Term
  }>()

  const loading = ref(false)
  const manager = computed(() => TermManagerRegistry.getManager(term.id))
  watch(manager, (manager) => {
    if (manager) {
      manager.e.addEventListener('reconnect-start', () => {
        loading.value = true
      })
      manager.e.addEventListener('reconnect-end', () => {
        loading.value = false
      })
    }
  }, { immediate: true })
</script>

<style scoped></style>
