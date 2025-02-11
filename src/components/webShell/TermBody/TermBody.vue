<template>
  <NSpin
    :show="loading"
    content-class="size-full"
  >
    <div
      :ref="el => (term.container = el as HTMLElement)"
      class="contain-strict size-full"
      :style="{ backgroundColor: settingsStore.theme.background }"
    />
  </NSpin>
</template>

<script setup lang="ts">
import { watchEffect, ref, computed, watch } from 'vue'
import { NSpin } from 'naive-ui'

import type { Term } from '../xterm'
import { useWebshellSettingsStore } from '../stores/settings'
import { TermManagerRegistry } from '../termManagerRegistry'

const settingsStore = useWebshellSettingsStore()

const { term } = defineProps<{
  term: Term
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

watchEffect(() => {
  term.options.theme = settingsStore.theme
})
watchEffect(() => {
  term.options.fontSize = settingsStore.fontSize
})
</script>

<style scoped></style>
