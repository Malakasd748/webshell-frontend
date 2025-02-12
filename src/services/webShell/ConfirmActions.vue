<template>
  <div class="flex gap-2 justify-end mt-6">
    <NButton @click="emit('skip')">
      跳过
    </NButton>
    <NButton
      type="primary"
      @click="emit('overwrite')"
    >
      替换
    </NButton>
    <NButton
      type="primary"
      @click="emit('keepBoth')"
    >
      保留两者
    </NButton>
  </div>
</template>

<script setup lang="ts">
  import { NButton } from 'naive-ui'

  const emit = defineEmits(['skip', 'overwrite', 'keepBoth'])
</script>
