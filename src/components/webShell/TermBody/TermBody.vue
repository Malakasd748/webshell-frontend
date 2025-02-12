<template>
  <NSpin
    :show="loading"
    content-class="size-full"
  >
    <div
      :ref="el => emit('container-change', el as HTMLDivElement)"
      class="contain-strict size-full"
      :style="{ backgroundColor: settingsStore.theme.background }"
    ></div>
  </NSpin>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { NSpin } from 'naive-ui'

  import type { Term } from '@/xterm'
  import { useWebShellSettingsStore } from '@/stores/webShellSettings'
  import { TermManagerRegistry } from '@/services/termManagerRegistry'

  const settingsStore = useWebShellSettingsStore()

  const { term } = defineProps<{
    term: Term
  }>()

  const emit = defineEmits<{
    (e: 'container-change', value: HTMLDivElement | null): void
  }>()

  const loading = ref(false)
  const manager = computed(() => TermManagerRegistry.getManager(term.id))
  watch(manager, (manager) => {
    if (manager) {
      manager.addEventListener('reconnect-start', () => {
        loading.value = true
      })
      manager.addEventListener('reconnect-end', () => {
        loading.value = false
      })
    }
  })
</script>

<style scoped></style>
