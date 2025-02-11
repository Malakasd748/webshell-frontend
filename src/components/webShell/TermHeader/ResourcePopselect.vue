<template>
  <NPopselect
    v-bind="props"
    v-model:value="resourceStore.selectedResourceId"
    :options="options"
    @update:value="(id) => termStore.addTerm(id)"
  >
    <slot />

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

import { useWebshellResourceStore } from '../stores/resource'
import { useWebshellTermStore } from '../stores/term'
import { webshellNotifyOpenerReady, setupWebshell } from '../windowMessage'

const props = defineProps(popselectProps)

const resourceStore = useWebshellResourceStore()
const termStore = useWebshellTermStore()

if (resourceStore.resources.length === 0) {
  resourceStore.fetchResources()
}

const options = computed(() =>
  resourceStore.resources.map(r => ({ label: r.name, value: r.id })),
)

setupWebshell()
webshellNotifyOpenerReady()
</script>

<style scoped></style>
