<template>
  <NPopselect
    v-bind="props"
    v-model:value="selectedResourceName"
    :options="options"
    @update:value="(id) => termStore.addTerm(id)"
  >
    <slot></slot>

    <template #header>
      <NButton
        class="w-full"
        text
        @click="emit('new-ssh')"
      >
        新建 SSH 连接
      </NButton>
    </template>

    <template #empty>
      <NEmpty
        description="暂无 SSH 连接"
        :show-icon="false"
      />
    </template>
  </NPopselect>
</template>

<script setup lang="ts">
  import { NButton, NPopselect, popselectProps, NEmpty } from 'naive-ui'
  import { computed } from 'vue'

  import { useWebShellResourceStore } from '@/stores/webshellResource'
  import { useWebShellTermStore } from '@/stores/webshellTerm'

  const props = defineProps(popselectProps)
  const emit = defineEmits(['new-ssh'])

  const resourceStore = useWebShellResourceStore()
  const termStore = useWebShellTermStore()

  const selectedResourceName = computed({
    get: () => resourceStore.selectedResource?.name,
    set: (name) => {
      if (name !== undefined) {
        resourceStore.selectResource(name)
      }
    },
  })

  const options = computed(() =>
    resourceStore.resources.map(r => ({ label: r.name, value: r.name })),
  )

</script>

<style scoped></style>
