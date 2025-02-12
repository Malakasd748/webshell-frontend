<template>
  <NButton
    v-bind="props"
    quaternary
    :focusable="false"
    size="tiny"
  >
    <slot></slot>
  </NButton>
</template>

<script setup lang="ts">
  import { NButton } from 'naive-ui'
  import { buttonProps } from 'naive-ui'

  const props = defineProps(buttonProps)
</script>
