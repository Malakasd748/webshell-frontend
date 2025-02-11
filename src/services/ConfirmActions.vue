<template>
  <div class="flex gap-2 justify-end mt-6">
    <Button @click="emit('skip')">
      跳过
    </Button>
    <Button
      type="primary"
      @click="emit('overwrite')"
    >
      替换
    </Button>
    <Button
      type="primary"
      @click="emit('keepBoth')"
    >
      保留两者
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from 'ant-design-vue'

const emit = defineEmits(['skip', 'overwrite', 'keepBoth'])
</script>
