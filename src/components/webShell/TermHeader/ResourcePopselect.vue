<template>
  <NPopselect
    v-bind="props"
    v-model:value="selectedResourceId"
    :options="options"
    @update:value="(id) => termStore.addTerm(id)"
  >
    <slot></slot>

    <template #empty>
      <NSpin :show="false">
        <NEmpty />
      </NSpin>
    </template>
  </NPopselect>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { NPopselect, popselectProps, NSpin, NEmpty } from 'naive-ui'

  import { useWebShellResourceStore } from '@/stores/webshellResource'
  import { useWebShellTermStore } from '@/stores/webshellTerm'
  // import { webshellNotifyOpenerReady, setupWebshell } from '@/utils/webShell/windowMessage'

  const props = defineProps(popselectProps)

  const resourceStore = useWebShellResourceStore()
  const termStore = useWebShellTermStore()

  const selectedResourceId = computed({
    get: () => resourceStore.selectedResource?.id,
    set: (id) => {
      if (id !== undefined) {
        resourceStore.selectResourceById(id)
      }
    },
  })

  const options = computed(() =>
    resourceStore.resources.map(r => ({ label: r.name, value: r.id })),
  )

  // setupWebshell()
  // webshellNotifyOpenerReady()
</script>

<style scoped></style>
